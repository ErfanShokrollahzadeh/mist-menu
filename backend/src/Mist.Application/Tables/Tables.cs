using Mist.Application.Abstractions;

namespace Mist.Application.Tables;

public sealed record TableDto(
    Guid Id, string Number, string Zone, int Seats, bool IsActive, string QrToken);

/// <summary>What a customer's device gets back. Deliberately does not echo the
/// token — the device already has it, and nothing else should learn it.</summary>
public sealed record ResolvedTableDto(string Number, string Zone);

public sealed record ResolveTableQuery(string QrToken) : IRequest<ResolvedTableDto?>;

public sealed class ResolveTableHandler(ITableRepository tables)
    : IRequestHandler<ResolveTableQuery, ResolvedTableDto?>
{
    public Task<ResolvedTableDto?> Handle(ResolveTableQuery request, CancellationToken ct) =>
        tables.ResolveAsync(request.QrToken, ct);
}

public sealed record ListTablesQuery : IRequest<IReadOnlyList<TableDto>>;

public sealed class ListTablesHandler(ITableRepository tables)
    : IRequestHandler<ListTablesQuery, IReadOnlyList<TableDto>>
{
    public Task<IReadOnlyList<TableDto>> Handle(ListTablesQuery request, CancellationToken ct) =>
        tables.ListAsync(ct);
}

public sealed record UpsertTableInput(string Number, string Zone, int Seats, bool IsActive);
public sealed record UpsertTableCommand(UpsertTableInput Input) : IRequest<TableDto>;

public sealed class UpsertTableHandler(ITableRepository tables)
    : IRequestHandler<UpsertTableCommand, TableDto>
{
    public Task<TableDto> Handle(UpsertTableCommand request, CancellationToken ct)
    {
        var input = request.Input;
        if (string.IsNullOrWhiteSpace(input.Number))
            throw new ArgumentException("A table number is required.", nameof(request));
        if (input.Seats is < 1 or > 40)
            throw new ArgumentOutOfRangeException(nameof(request), "Seats must be between 1 and 40.");
        return tables.UpsertAsync(input, ct);
    }
}

/// <summary>Issues a fresh token, invalidating whatever is printed today.</summary>
public sealed record RotateTableTokenCommand(string Number) : IRequest<TableDto>;

public sealed class RotateTableTokenHandler(ITableRepository tables)
    : IRequestHandler<RotateTableTokenCommand, TableDto>
{
    public Task<TableDto> Handle(RotateTableTokenCommand request, CancellationToken ct) =>
        tables.RotateTokenAsync(request.Number, ct);
}

public interface ITableRepository
{
    Task<ResolvedTableDto?> ResolveAsync(string qrToken, CancellationToken ct);
    Task<IReadOnlyList<TableDto>> ListAsync(CancellationToken ct);
    Task<TableDto> UpsertAsync(UpsertTableInput input, CancellationToken ct);
    Task<TableDto> RotateTokenAsync(string number, CancellationToken ct);
}
