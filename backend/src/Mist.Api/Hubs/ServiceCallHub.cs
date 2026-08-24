using Microsoft.AspNetCore.SignalR;

namespace Mist.Api.Hubs;

public sealed class ServiceCallHub : Hub
{
    public const string StaffGroup = "staff";
    public static string TableGroup(string tableId) => $"table:{tableId}";

    public Task JoinTable(string tableId) =>
        Groups.AddToGroupAsync(Context.ConnectionId, TableGroup(tableId));

    public Task JoinStaff() => Groups.AddToGroupAsync(Context.ConnectionId, StaffGroup);

    public Task AcknowledgeCall(Guid callId) =>
        Clients.Group(StaffGroup).SendAsync("CallAcknowledged", new { callId });
}
