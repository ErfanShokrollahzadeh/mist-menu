using Microsoft.AspNetCore.SignalR;
using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Api.Hubs;

/// <summary>
/// The Application layer depends on IRealtimeNotifier, not on SignalR, so the
/// transport stays swappable and handlers remain testable without a hub.
/// </summary>
public sealed class SignalRNotifier(
    IHubContext<OrderHub> orders,
    IHubContext<ServiceCallHub> service) : IRealtimeNotifier
{
    public async Task OrderCreated(OrderDto order, CancellationToken ct)
    {
        await orders.Clients.Group(OrderHub.StaffGroup).SendAsync("OrderCreated", order, ct);
        await orders.Clients.Group(OrderHub.TableGroup(order.TableId))
            .SendAsync("OrderCreated", order, ct);
    }

    public async Task OrderStatusChanged(Guid orderId, string tableId, string status, CancellationToken ct)
    {
        var payload = new { orderId, status, changedAt = DateTimeOffset.UtcNow };
        await orders.Clients.Group(OrderHub.StaffGroup).SendAsync("OrderStatusChanged", payload, ct);
        await orders.Clients.Group(OrderHub.TableGroup(tableId))
            .SendAsync("OrderStatusChanged", payload, ct);
    }

    public Task WaiterCalled(WaiterCallDto call, CancellationToken ct) =>
        service.Clients.Group(ServiceCallHub.StaffGroup).SendAsync("WaiterCalled", call, ct);

    public Task BillRequested(BillRequestDto request, CancellationToken ct) =>
        service.Clients.Group(ServiceCallHub.StaffGroup).SendAsync("BillRequested", request, ct);
}
