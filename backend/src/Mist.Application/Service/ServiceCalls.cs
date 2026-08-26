using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Application.Service;

public sealed record CallWaiterCommand(WaiterCallInput Input) : IRequest<WaiterCallDto>;

public sealed class CallWaiterHandler(IServiceCallRepository repo, IRealtimeNotifier notifier)
    : IRequestHandler<CallWaiterCommand, WaiterCallDto>
{
    public async Task<WaiterCallDto> Handle(CallWaiterCommand request, CancellationToken ct)
    {
        var call = await repo.CreateWaiterCallAsync(request.Input, ct);
        await notifier.WaiterCalled(call, ct);
        return call;
    }
}

public sealed record RequestBillCommand(BillRequestInput Input) : IRequest<BillRequestDto>;

public sealed class RequestBillHandler(IServiceCallRepository repo, IRealtimeNotifier notifier)
    : IRequestHandler<RequestBillCommand, BillRequestDto>
{
    public async Task<BillRequestDto> Handle(RequestBillCommand request, CancellationToken ct)
    {
        var bill = await repo.CreateBillRequestAsync(request.Input, ct);
        await notifier.BillRequested(bill, ct);
        return bill;
    }
}

public interface IServiceCallRepository
{
    Task<WaiterCallDto> CreateWaiterCallAsync(WaiterCallInput input, CancellationToken ct);
    Task<BillRequestDto> CreateBillRequestAsync(BillRequestInput input, CancellationToken ct);
}
