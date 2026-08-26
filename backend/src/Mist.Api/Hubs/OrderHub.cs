using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace Mist.Api.Hubs;

/// <summary>
/// Customers join their own table group; staff join a single "staff" group.
/// Groups are what keep one table's order traffic off every other phone.
/// </summary>
public sealed class OrderHub : Hub
{
    public const string StaffGroup = "staff";
    public static string TableGroup(string tableId) => $"table:{tableId}";

    public Task JoinTable(string tableId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, TableGroup(tableId));

    public Task LeaveTable(string tableId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, TableGroup(tableId));

    /// <summary>
    /// Kitchen display and waiter tablets. Requires a staff token, which the
    /// browser supplies as an access_token query parameter because WebSockets
    /// cannot send an Authorization header (see the JwtBearerEvents hook in
    /// Program.cs).
    /// </summary>
    [Authorize(Policy = "staff")]
    public Task JoinStaff() => Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);
}
