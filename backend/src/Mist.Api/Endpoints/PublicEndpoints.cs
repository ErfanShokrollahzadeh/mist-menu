using Mist.Application.Abstractions;
using Mist.Application.Contracts;
using Mist.Application.Feedback;
using Mist.Application.Menu;
using Mist.Application.Orders;
using Mist.Application.Service;
using Mist.Application.Tables;

namespace Mist.Api.Endpoints;

public static class PublicEndpoints
{
    public static void MapPublicEndpoints(this IEndpointRouteBuilder app)
    {
        var api = app.MapGroup("/api/v1").WithTags("public");

        api.MapGet("/menu", async (IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new GetMenuQuery(), ct)))
           .WithName("GetMenu");

        api.MapGet("/tables/{tableId}/orders/active",
                async (string tableId, IDispatcher dispatcher, CancellationToken ct) =>
                    Results.Ok(await dispatcher.Send(new GetActiveOrdersQuery(tableId), ct)))
           .WithName("GetActiveOrders");

        api.MapPost("/orders", async (PlaceOrderInput input, IDispatcher dispatcher, CancellationToken ct) =>
            {
                var order = await dispatcher.Send(new PlaceOrderCommand(input), ct);
                return Results.Created($"/api/v1/orders/{order.Id}", order);
            })
           .WithName("PlaceOrder")
           // Anonymous, so rate-limited: otherwise ordering is a spam vector.
           .RequireRateLimiting("public-write");

        api.MapPost("/service/waiter-calls",
                async (WaiterCallInput input, IDispatcher dispatcher, CancellationToken ct) =>
                    Results.Ok(await dispatcher.Send(new CallWaiterCommand(input), ct)))
           .WithName("CallWaiter")
           .RequireRateLimiting("public-write");

        api.MapPost("/service/bill-requests",
                async (BillRequestInput input, IDispatcher dispatcher, CancellationToken ct) =>
                    Results.Ok(await dispatcher.Send(new RequestBillCommand(input), ct)))
           .WithName("RequestBill")
           .RequireRateLimiting("public-write");

        // Anonymous by necessity: the customer scanning the code has no account.
        // An unknown token 404s, so guessing one buys nothing.
        api.MapGet("/tables/resolve/{qrToken}", async (
                string qrToken, IDispatcher dispatcher, CancellationToken ct) =>
            {
                var table = await dispatcher.Send(new ResolveTableQuery(qrToken), ct);
                return table is null ? Results.NotFound() : Results.Ok(table);
            })
           .WithName("ResolveTable");

        api.MapPost("/feedback",
                async (FeedbackInput input, IDispatcher dispatcher, CancellationToken ct) =>
                    Results.Ok(await dispatcher.Send(new SubmitFeedbackCommand(input), ct)))
           .WithName("SubmitFeedback")
           .RequireRateLimiting("public-write");
    }
}
