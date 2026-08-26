using Microsoft.EntityFrameworkCore;
using Mist.Application.Analytics;
using Mist.Domain.Enums;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

/// <summary>
/// Every figure here is aggregated by Postgres. Pulling orders into memory to
/// sum them would work at 251 items and fall over at a year of trading.
/// </summary>
public sealed class AnalyticsReader(MistDbContext db) : IAnalyticsReader
{
    public async Task<AnalyticsDto> ReadAsync(DateOnly from, DateOnly to, CancellationToken ct)
    {
        var start = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        // Exclusive upper bound: `to` is inclusive for the caller.
        var end = to.AddDays(1).ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);

        // Cancelled orders are not sales; unpaid ones are still committed revenue.
        var scope = db.Orders.AsNoTracking()
            .Where(o => o.Status != OrderStatus.Cancelled)
            .Where(o => o.CreatedAt >= start && o.CreatedAt < end);

        var totals = await scope
            .GroupBy(_ => 1)
            .Select(g => new
            {
                OrderCount = g.Count(),
                RevenueMinor = g.Sum(o => (long)o.TotalMinor),
            })
            .FirstOrDefaultAsync(ct);

        var itemsSold = await db.OrderItems.AsNoTracking()
            .Where(i => scope.Any(o => o.Id == i.OrderId))
            .SumAsync(i => (int?)i.Quantity, ct) ?? 0;

        var revenue = await scope
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new
            {
                Day = g.Key,
                RevenueMinor = g.Sum(o => (long)o.TotalMinor),
                OrderCount = g.Count(),
            })
            .OrderBy(x => x.Day)
            .ToListAsync(ct);

        var peak = await scope
            .GroupBy(o => new { Dow = o.CreatedAt.DayOfWeek, Hour = o.CreatedAt.Hour })
            .Select(g => new
            {
                g.Key.Dow,
                g.Key.Hour,
                OrderCount = g.Count(),
                RevenueMinor = g.Sum(o => (long)o.TotalMinor),
            })
            .ToListAsync(ct);

        var topItems = await db.OrderItems.AsNoTracking()
            .Where(i => scope.Any(o => o.Id == i.OrderId))
            .GroupBy(i => new { i.MenuItemId, i.NameSnapshot.Tr, i.NameSnapshot.En })
            .Select(g => new
            {
                g.Key.MenuItemId,
                g.Key.Tr,
                g.Key.En,
                QuantitySold = g.Sum(i => i.Quantity),
                RevenueMinor = g.Sum(i => (long)i.LineTotalMinor),
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(10)
            .ToListAsync(ct);

        var slugs = await db.MenuItems.AsNoTracking()
            .Where(m => topItems.Select(t => t.MenuItemId).Contains(m.Id))
            .Select(m => new { m.Id, m.Slug, CategorySlug = m.Category!.Slug })
            .ToDictionaryAsync(x => x.Id, ct);

        var prep = await PrepMinutesAsync(start, end, ct);

        return new AnalyticsDto(
            from, to,
            new SalesSummaryDto(
                totals?.OrderCount ?? 0,
                totals?.RevenueMinor ?? 0,
                totals is { OrderCount: > 0 } ? totals.RevenueMinor / totals.OrderCount : 0,
                itemsSold,
                prep.Median, prep.P90),
            revenue.Select(r => new RevenuePointDto(
                DateOnly.FromDateTime(r.Day), r.RevenueMinor, r.OrderCount)).ToList(),
            peak.Select(p => new PeakCellDto(
                (int)p.Dow, p.Hour, p.OrderCount, p.RevenueMinor)).ToList(),
            topItems.Select(t => new TopItemDto(
                slugs.TryGetValue(t.MenuItemId, out var s) ? s.Slug : "",
                slugs.TryGetValue(t.MenuItemId, out var c) ? c.CategorySlug : "",
                t.Tr, t.En, t.QuantitySold, t.RevenueMinor)).ToList());
    }

    /// <summary>
    /// Prep time is Received -> Ready, read from the status events. It cannot be
    /// derived from Order alone, which keeps only CreatedAt and UpdatedAt.
    /// </summary>
    private async Task<(double? Median, double? P90)> PrepMinutesAsync(
        DateTime start, DateTime end, CancellationToken ct)
    {
        var durations = await db.OrderStatusEvents.AsNoTracking()
            .Where(e => e.ToStatus == OrderStatus.Ready && e.ChangedAt >= start && e.ChangedAt < end)
            .Join(db.Orders.AsNoTracking(), e => e.OrderId, o => o.Id,
                  (e, o) => (e.ChangedAt - o.CreatedAt).TotalMinutes)
            .ToListAsync(ct);

        if (durations.Count == 0) return (null, null);

        durations.Sort();
        return (Percentile(durations, 0.50), Percentile(durations, 0.90));
    }

    private static double Percentile(IReadOnlyList<double> sorted, double p)
    {
        if (sorted.Count == 1) return Math.Round(sorted[0], 1);
        var rank = p * (sorted.Count - 1);
        var lo = (int)Math.Floor(rank);
        var hi = (int)Math.Ceiling(rank);
        var value = lo == hi ? sorted[lo] : sorted[lo] + (sorted[hi] - sorted[lo]) * (rank - lo);
        return Math.Round(value, 1);
    }
}
