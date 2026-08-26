using System.Security.Claims;
using Mist.Application.Abstractions;
using Mist.Application.Analytics;
using Mist.Application.Orders;
using Mist.Domain.Enums;

namespace Mist.Api.Endpoints;

public sealed record ChangeStatusRequest(string Status);

public static class AdminEndpoints
{
    public static void MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        // Everything under /admin requires at least a staff token.
        var admin = app.MapGroup("/api/v1/admin")
            .WithTags("admin")
            .RequireAuthorization("staff");

        admin.MapGet("/orders/board", async (IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new GetKitchenBoardQuery(), ct)))
             .WithName("GetKitchenBoard");

        admin.MapPatch("/orders/{id:guid}/status", async (
                Guid id, ChangeStatusRequest body, ClaimsPrincipal user,
                IDispatcher dispatcher, CancellationToken ct) =>
            {
                if (!Enum.TryParse<OrderStatus>(body.Status, ignoreCase: true, out var target))
                    return Results.Problem(
                        title: "Unknown status", detail: $"'{body.Status}' is not an order status.",
                        statusCode: StatusCodes.Status400BadRequest);

                var staffId = Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier)
                                            ?? user.FindFirstValue("sub"), out var parsed)
                    ? parsed : (Guid?)null;

                var order = await dispatcher.Send(
                    new ChangeOrderStatusCommand(id, target, staffId, user.Identity?.Name), ct);
                return Results.Ok(order);
            })
             .WithName("ChangeOrderStatus");

        // Sales figures are the owner's business, not every waiter's.
        admin.MapGet("/analytics", async (
                DateOnly? from, DateOnly? to, IDispatcher dispatcher, CancellationToken ct) =>
            {
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var start = from ?? today.AddDays(-29);
                var end = to ?? today;
                return Results.Ok(await dispatcher.Send(new GetAnalyticsQuery(start, end), ct));
            })
             .WithName("GetAnalytics")
             .RequireAuthorization("admin");
    }
}
