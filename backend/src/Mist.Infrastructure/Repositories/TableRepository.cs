using Microsoft.EntityFrameworkCore;
using Mist.Application.Tables;
using Mist.Domain.Entities;
using Mist.Domain.Enums;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

public sealed class TableRepository(MistDbContext db) : ITableRepository
{
    public async Task<ResolvedTableDto?> ResolveAsync(string qrToken, CancellationToken ct)
    {
        // An unknown or inactive token resolves to nothing, so a guessed value
        // cannot be used to order to somebody else's table.
        var table = await db.Tables.AsNoTracking()
            .FirstOrDefaultAsync(t => t.QrToken == qrToken && t.IsActive, ct);
        return table is null ? null : new ResolvedTableDto(table.Number, table.Zone.ToString());
    }

    public async Task<IReadOnlyList<TableDto>> ListAsync(CancellationToken ct) =>
        await db.Tables.AsNoTracking()
            .OrderBy(t => t.Zone).ThenBy(t => t.Number.Length).ThenBy(t => t.Number)
            .Select(t => new TableDto(t.Id, t.Number, t.Zone.ToString(), t.Seats, t.IsActive, t.QrToken))
            .ToListAsync(ct);

    public async Task<TableDto> UpsertAsync(UpsertTableInput input, CancellationToken ct)
    {
        if (!Enum.TryParse<TableZone>(input.Zone, ignoreCase: true, out var zone))
            throw new ArgumentException($"Unknown zone '{input.Zone}'.", nameof(input));

        var table = await db.Tables.FirstOrDefaultAsync(t => t.Number == input.Number, ct);
        if (table is null)
        {
            table = new CafeTable { Number = input.Number.Trim() };
            db.Tables.Add(table);
        }

        table.Zone = zone;
        table.Seats = input.Seats;
        table.IsActive = input.IsActive;

        await db.SaveChangesAsync(ct);
        return Map(table);
    }

    public async Task<TableDto> RotateTokenAsync(string number, CancellationToken ct)
    {
        var table = await db.Tables.FirstOrDefaultAsync(t => t.Number == number, ct)
            ?? throw new InvalidOperationException($"Unknown table '{number}'.");

        // Every printed code for this table stops working the moment this runs.
        table.QrToken = Guid.CreateVersion7().ToString("N");
        await db.SaveChangesAsync(ct);
        return Map(table);
    }

    private static TableDto Map(CafeTable t) =>
        new(t.Id, t.Number, t.Zone.ToString(), t.Seats, t.IsActive, t.QrToken);
}
