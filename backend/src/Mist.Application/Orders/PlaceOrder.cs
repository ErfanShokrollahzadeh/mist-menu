using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Application.Orders;

public sealed record PlaceOrderCommand(PlaceOrderInput Input) : IRequest<OrderDto>;

public sealed class PlaceOrderHandler(IOrderRepository orders, IRealtimeNotifier notifier)
    : IRequestHandler<PlaceOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(PlaceOrderCommand request, CancellationToken ct)
    {
        var input = request.Input;

        if (input.Lines.Count == 0)
            throw new ArgumentException("An order must contain at least one line.", nameof(request));

        // Idempotency: a retried submit returns the original order rather than
        // charging the table twice.
        var existing = await orders.FindByClientRequestIdAsync(input.ClientRequestId, ct);
        if (existing is not null) return existing;

        var order = await orders.CreateAsync(input, ct);
        await notifier.OrderCreated(order, ct);
        return order;
    }
}

public sealed record GetActiveOrdersQuery(string TableId) : IRequest<IReadOnlyList<OrderDto>>;

public sealed class GetActiveOrdersHandler(IOrderRepository orders)
    : IRequestHandler<GetActiveOrdersQuery, IReadOnlyList<OrderDto>>
{
    public Task<IReadOnlyList<OrderDto>> Handle(GetActiveOrdersQuery request, CancellationToken ct) =>
        orders.ActiveForTableAsync(request.TableId, ct);
}

public interface IOrderRepository
{
    Task<OrderDto?> FindByClientRequestIdAsync(string clientRequestId, CancellationToken ct);
    Task<OrderDto> CreateAsync(PlaceOrderInput input, CancellationToken ct);
    Task<IReadOnlyList<OrderDto>> ActiveForTableAsync(string tableId, CancellationToken ct);

    Task<Mist.Domain.Enums.OrderStatus?> GetStatusAsync(Guid orderId, CancellationToken ct);

    /// <summary>Writes the new status and an OrderStatusEvent in one transaction.</summary>
    Task<OrderDto> ChangeStatusAsync(
        Guid orderId, Mist.Domain.Enums.OrderStatus from, Mist.Domain.Enums.OrderStatus to,
        Guid? staffUserId, string? staffName, CancellationToken ct);

    /// <summary>Everything the kitchen still has to act on.</summary>
    Task<IReadOnlyList<OrderDto>> KitchenBoardAsync(CancellationToken ct);
}
