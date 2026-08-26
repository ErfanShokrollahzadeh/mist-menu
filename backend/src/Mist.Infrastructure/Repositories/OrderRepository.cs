using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Mist.Application.Contracts;
using Mist.Application.Orders;
using Mist.Domain.Entities;
using Mist.Domain.Enums;
using Mist.Domain.ValueObjects;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

public sealed class OrderRepository(MistDbContext db) : IOrderRepository
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task<OrderDto?> FindByClientRequestIdAsync(string clientRequestId, CancellationToken ct)
    {
        var order = await Query().FirstOrDefaultAsync(o => o.ClientRequestId == clientRequestId, ct);
        return order is null ? null : Map(order);
    }

    public async Task<OrderDto> CreateAsync(PlaceOrderInput input, CancellationToken ct)
    {
        var table = await db.Tables.FirstOrDefaultAsync(t => t.Number == input.TableId, ct)
            ?? throw new InvalidOperationException($"Unknown table '{input.TableId}'.");

        var slugs = input.Lines.Select(l => l.ItemSlug).Distinct().ToList();
        var items = await db.MenuItems
            .Include(i => i.Category)
            .Include(i => i.ModifierGroups).ThenInclude(g => g.Options)
            .Where(i => slugs.Contains(i.Slug))
            .ToListAsync(ct);

        var order = new Order
        {
            CafeTableId = table.Id,
            OrderNumber = NextOrderNumber(),
            ClientRequestId = input.ClientRequestId,
            Locale = input.Locale,
            Note = input.Note,
            Status = OrderStatus.Received,
        };

        foreach (var line in input.Lines)
        {
            var item = items.FirstOrDefault(i =>
                i.Slug == line.ItemSlug && i.Category!.Slug == line.CategorySlug)
                ?? throw new InvalidOperationException($"Unknown item '{line.CategorySlug}/{line.ItemSlug}'.");

            var chosen = new List<object>();
            var delta = 0;
            foreach (var (groupSlug, optionSlugs) in line.Selections)
            {
                var group = item.ModifierGroups.FirstOrDefault(g => g.Slug == groupSlug);
                if (group is null) continue;
                foreach (var optionSlug in optionSlugs)
                {
                    var option = group.Options.FirstOrDefault(o => o.Slug == optionSlug);
                    if (option is null) continue;
                    delta += option.PriceDeltaMinor;
                    chosen.Add(new { group = groupSlug, option = optionSlug, tr = option.Name.Tr, en = option.Name.En });
                }
            }

            var unit = item.PriceMinor + delta;
            order.Items.Add(new OrderItem
            {
                MenuItemId = item.Id,
                // Snapshotted: editing the menu later must not rewrite history.
                NameSnapshot = new LocalizedText(item.Name.Tr, item.Name.En),
                UnitPriceMinor = unit,
                Quantity = line.Quantity,
                LineTotalMinor = unit * line.Quantity,
                SelectedOptionsJson = JsonSerializer.Serialize(chosen, Json),
                Note = line.Note,
            });
        }

        order.SubtotalMinor = order.Items.Sum(i => i.LineTotalMinor);
        order.TotalMinor = order.SubtotalMinor;

        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        var saved = await Query().FirstAsync(o => o.Id == order.Id, ct);
        return Map(saved);
    }

    public async Task<IReadOnlyList<OrderDto>> ActiveForTableAsync(string tableId, CancellationToken ct)
    {
        var orders = await Query()
            .Where(o => o.CafeTable!.Number == tableId && o.Status != OrderStatus.Paid && o.Status != OrderStatus.Cancelled)
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(ct);
        return orders.Select(Map).ToList();
    }

    public async Task<OrderStatus?> GetStatusAsync(Guid orderId, CancellationToken ct)
    {
        var found = await db.Orders.AsNoTracking()
            .Where(o => o.Id == orderId)
            .Select(o => (OrderStatus?)o.Status)
            .FirstOrDefaultAsync(ct);
        return found;
    }

    public async Task<OrderDto> ChangeStatusAsync(
        Guid orderId, OrderStatus from, OrderStatus to,
        Guid? staffUserId, string? staffName, CancellationToken ct)
    {
        var order = await db.Orders.FirstOrDefaultAsync(o => o.Id == orderId, ct)
            ?? throw new InvalidOperationException($"Unknown order '{orderId}'.");

        // Guard against two staff dragging the same card at once: if the row
        // moved since the caller read it, their move is stale.
        if (order.Status != from)
            throw new ArgumentException(
                $"Order already moved to {order.Status}; refresh the board.", nameof(from));

        order.Status = to;
        order.UpdatedAt = DateTimeOffset.UtcNow;

        db.OrderStatusEvents.Add(new OrderStatusEvent
        {
            OrderId = orderId,
            FromStatus = from,
            ToStatus = to,
            ChangedByStaffUserId = staffUserId,
            ChangedByName = staffName,
        });

        await db.SaveChangesAsync(ct);

        var saved = await Query().FirstAsync(o => o.Id == orderId, ct);
        return Map(saved);
    }

    public async Task<IReadOnlyList<OrderDto>> KitchenBoardAsync(CancellationToken ct)
    {
        var orders = await Query()
            .Where(o => o.Status != OrderStatus.Cancelled)
            // Paid orders leave the board after a while; keeping the last hour
            // gives staff somewhere to correct a mis-drag.
            .Where(o => o.Status != OrderStatus.Paid || o.UpdatedAt > DateTimeOffset.UtcNow.AddHours(-1))
            .OrderBy(o => o.CreatedAt)
            .ToListAsync(ct);
        return orders.Select(Map).ToList();
    }

    private IQueryable<Order> Query() =>
        db.Orders.AsNoTracking()
            .Include(o => o.CafeTable)
            .Include(o => o.Items).ThenInclude(i => i.MenuItem).ThenInclude(m => m!.Category);

    private static string NextOrderNumber() =>
        DateTimeOffset.UtcNow.ToString("HHmmss") + Random.Shared.Next(10, 99);

    private static OrderDto Map(Order o) => new(
        o.Id, o.OrderNumber, o.CafeTable!.Number,
        o.Status.ToString().ToLowerInvariant(), o.TotalMinor, o.CreatedAt,
        o.Items.Select(i => new OrderLineDto(
            i.MenuItem?.Category?.Slug ?? string.Empty,
            i.MenuItem?.Slug ?? string.Empty,
            new LocalizedDto(i.NameSnapshot.Tr, i.NameSnapshot.En),
            i.Quantity, i.UnitPriceMinor, i.LineTotalMinor,
            ParseOptions(i.SelectedOptionsJson), i.Note)).ToList());

    private static List<LocalizedDto> ParseOptions(string json)
    {
        try
        {
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.EnumerateArray()
                .Select(e => new LocalizedDto(
                    e.GetProperty("tr").GetString() ?? "",
                    e.GetProperty("en").GetString() ?? ""))
                .ToList();
        }
        catch (JsonException) { return []; }
    }
}
