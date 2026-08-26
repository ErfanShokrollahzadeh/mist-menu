using System.Security.Claims;
using Mist.Application.Abstractions;
using Mist.Application.Analytics;
using Mist.Application.MenuAdmin;
using Mist.Application.Tables;
using Mist.Application.Orders;
using Mist.Domain.Enums;

namespace Mist.Api.Endpoints;

public sealed record ChangeStatusRequest(string Status);
public sealed record SetAvailabilityRequest(bool IsAvailable);
public sealed record ReorderRequest(IReadOnlyList<string> Slugs);

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

        /* ── Menu CMS ────────────────────────────────────────────────────
           Availability is a shift-floor decision, so staff may toggle it.
           Everything that changes prices or the menu's shape is admin-only. */

        admin.MapPatch("/menu/{categorySlug}/{slug}/availability", async (
                string categorySlug, string slug, SetAvailabilityRequest body,
                IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(
                    new SetItemAvailabilityCommand(categorySlug, slug, body.IsAvailable), ct)))
             .WithName("SetItemAvailability");

        admin.MapPut("/menu/items", async (
                UpsertItemInput body, IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new UpsertItemCommand(body), ct)))
             .WithName("UpsertMenuItem")
             .RequireAuthorization("admin");

        admin.MapDelete("/menu/{categorySlug}/{slug}", async (
                string categorySlug, string slug, IDispatcher dispatcher, CancellationToken ct) =>
                await dispatcher.Send(new DeleteItemCommand(categorySlug, slug), ct)
                    ? Results.NoContent()
                    : Results.NotFound())
             .WithName("DeleteMenuItem")
             .RequireAuthorization("admin");

        admin.MapPost("/menu/{categorySlug}/reorder", async (
                string categorySlug, ReorderRequest body,
                IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(new { updated = await dispatcher.Send(
                    new ReorderItemsCommand(categorySlug, body.Slugs), ct) }))
             .WithName("ReorderMenuItems")
             .RequireAuthorization("admin");

        /* ── Tables & QR ─────────────────────────────────────────────────
           The listing includes QR tokens, so it is admin-only: a token is
           the credential that binds an order to a table. */

        admin.MapGet("/tables", async (IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new ListTablesQuery(), ct)))
             .WithName("ListTables")
             .RequireAuthorization("admin");

        admin.MapPut("/tables", async (
                UpsertTableInput body, IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new UpsertTableCommand(body), ct)))
             .WithName("UpsertTable")
             .RequireAuthorization("admin");

        admin.MapPost("/tables/{number}/rotate", async (
                string number, IDispatcher dispatcher, CancellationToken ct) =>
                Results.Ok(await dispatcher.Send(new RotateTableTokenCommand(number), ct)))
             .WithName("RotateTableToken")
             .RequireAuthorization("admin");
    }
}
