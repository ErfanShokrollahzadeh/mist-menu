using Mist.Application.Contracts;

namespace Mist.Application.Abstractions;

/// <summary>Cache for the public menu. Backed by Redis when configured,
/// in-memory otherwise, so `dotnet run` works with no Redis at all.</summary>
public interface IMenuCache
{
    Task<MenuDocumentDto?> GetAsync(CancellationToken ct);
    Task SetAsync(MenuDocumentDto document, CancellationToken ct);
    Task InvalidateAsync(CancellationToken ct);
}

/// <summary>Push notifications to customers and staff. Implemented over
/// SignalR in the API layer; the Application layer stays transport-agnostic.</summary>
public interface IRealtimeNotifier
{
    Task OrderCreated(OrderDto order, CancellationToken ct);
    Task OrderStatusChanged(Guid orderId, string tableId, string status, CancellationToken ct);
    Task WaiterCalled(WaiterCallDto call, CancellationToken ct);
    Task BillRequested(BillRequestDto request, CancellationToken ct);
}
