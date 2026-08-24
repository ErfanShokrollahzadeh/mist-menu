using Microsoft.EntityFrameworkCore;
using Mist.Application.Contracts;
using Mist.Application.Feedback;
using Mist.Application.Service;
using Mist.Domain.Entities;
using Mist.Domain.Enums;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

public sealed class ServiceCallRepository(MistDbContext db) : IServiceCallRepository
{
    public async Task<WaiterCallDto> CreateWaiterCallAsync(WaiterCallInput input, CancellationToken ct)
    {
        var table = await Resolve(input.TableId, ct);
        var call = new WaiterCall
        {
            CafeTableId = table.Id,
            Reason = Enum.TryParse<WaiterCallReason>(input.Reason, true, out var r) ? r : WaiterCallReason.Assistance,
            Note = input.Note,
        };
        db.WaiterCalls.Add(call);
        await db.SaveChangesAsync(ct);
        return new WaiterCallDto(call.Id, table.Number, call.Reason.ToString().ToLowerInvariant(), call.CreatedAt);
    }

    public async Task<BillRequestDto> CreateBillRequestAsync(BillRequestInput input, CancellationToken ct)
    {
        var table = await Resolve(input.TableId, ct);
        var bill = new BillRequest
        {
            CafeTableId = table.Id,
            Method = Enum.TryParse<PaymentMethod>(input.Method, true, out var m) ? m : PaymentMethod.Card,
            SplitWays = input.SplitWays,
        };
        db.BillRequests.Add(bill);
        await db.SaveChangesAsync(ct);
        return new BillRequestDto(bill.Id, table.Number, bill.Method.ToString().ToLowerInvariant(), bill.SplitWays, bill.CreatedAt);
    }

    private async Task<CafeTable> Resolve(string tableId, CancellationToken ct) =>
        await db.Tables.FirstOrDefaultAsync(t => t.Number == tableId, ct)
        ?? throw new InvalidOperationException($"Unknown table '{tableId}'.");
}

public sealed class FeedbackRepository(MistDbContext db) : IFeedbackRepository
{
    public async Task<FeedbackDto> CreateAsync(FeedbackInput input, CancellationToken ct)
    {
        Guid? tableId = null;
        if (!string.IsNullOrWhiteSpace(input.TableId))
            tableId = (await db.Tables.FirstOrDefaultAsync(t => t.Number == input.TableId, ct))?.Id;

        var feedback = new Feedback
        {
            CafeTableId = tableId,
            Rating = input.Rating,
            Compliments = input.Compliments.ToArray(),
            Comment = input.Comment,
            Locale = input.Locale,
        };
        db.Feedback.Add(feedback);
        await db.SaveChangesAsync(ct);
        return new FeedbackDto(feedback.Id, feedback.CreatedAt);
    }
}
