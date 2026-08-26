using Mist.Application.Abstractions;
using Mist.Application.Contracts;
using Mist.Domain.Enums;

namespace Mist.Application.Orders;

public sealed record ChangeOrderStatusCommand(
    Guid OrderId, OrderStatus To, Guid? StaffUserId, string? StaffName) : IRequest<OrderDto>;

public sealed class ChangeOrderStatusHandler(IOrderRepository orders, IRealtimeNotifier notifier)
    : IRequestHandler<ChangeOrderStatusCommand, OrderDto>
{
    /// <summary>
    /// Legal forward moves, plus cancellation from any pre-payment state.
    /// A kitchen display is a shared surface where a mis-drag is routine, so
    /// the rules live here rather than being trusted to the UI.
    /// </summary>
    private static readonly Dictionary<OrderStatus, OrderStatus[]> Allowed = new()
    {
        [OrderStatus.Received]  = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Ready, OrderStatus.Received, OrderStatus.Cancelled],
        [OrderStatus.Ready]     = [OrderStatus.Served, OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Served]    = [OrderStatus.Paid, OrderStatus.Ready],
        [OrderStatus.Paid]      = [],        // terminal: money has changed hands
        [OrderStatus.Cancelled] = [],        // terminal
    };

    public async Task<OrderDto> Handle(ChangeOrderStatusCommand request, CancellationToken ct)
    {
        var current = await orders.GetStatusAsync(request.OrderId, ct)
            ?? throw new InvalidOperationException($"Unknown order '{request.OrderId}'.");

        if (current == request.To)
            throw new ArgumentException($"Order is already {current}.", nameof(request));

        if (!Allowed[current].Contains(request.To))
            throw new ArgumentException(
                $"Cannot move an order from {current} to {request.To}.", nameof(request));

        var order = await orders.ChangeStatusAsync(
            request.OrderId, current, request.To, request.StaffUserId, request.StaffName, ct);

        await notifier.OrderStatusChanged(order.Id, order.TableId, order.Status, ct);
        return order;
    }
}

public sealed record GetKitchenBoardQuery : IRequest<IReadOnlyList<OrderDto>>;

public sealed class GetKitchenBoardHandler(IOrderRepository orders)
    : IRequestHandler<GetKitchenBoardQuery, IReadOnlyList<OrderDto>>
{
    public Task<IReadOnlyList<OrderDto>> Handle(GetKitchenBoardQuery request, CancellationToken ct) =>
        orders.KitchenBoardAsync(ct);
}
