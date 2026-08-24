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

    /// <summary>Kitchen display and waiter tablets. Gated in pass 2 once the
    /// admin surfaces land; JWT plumbing is already wired in Program.cs.</summary>
    public Task JoinStaff() => Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);
}
