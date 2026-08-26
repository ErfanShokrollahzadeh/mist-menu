using Mist.Domain.Enums;
using Mist.Domain.ValueObjects;

namespace Mist.Domain.Entities;

public sealed class CafeTable
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Number { get; set; } = string.Empty;
    public TableZone Zone { get; set; } = TableZone.Indoor;
    public int Seats { get; set; } = 4;

    /// <summary>
    /// What the printed QR encodes. Deliberately not the table number: a bare
    /// number in the URL lets anyone order to any table.
    /// </summary>
    public string QrToken { get; set; } = Guid.CreateVersion7().ToString("N");

    public bool IsActive { get; set; } = true;

    public ICollection<Order> Orders { get; set; } = [];
    public ICollection<WaiterCall> WaiterCalls { get; set; } = [];
    public ICollection<BillRequest> BillRequests { get; set; } = [];
}

public sealed class Order
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string OrderNumber { get; set; } = string.Empty;
    public Guid CafeTableId { get; set; }
    public CafeTable? CafeTable { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Received;
    public string Locale { get; set; } = "tr";
    public int SubtotalMinor { get; set; }
    public int TotalMinor { get; set; }
    public string? Note { get; set; }

    /// <summary>Idempotency key. A retried submit must not create a second order.</summary>
    public string ClientRequestId { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = [];
}

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public Guid MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }

    /// <summary>
    /// Name and price are snapshotted at order time. Editing the menu later
    /// must not rewrite what a customer was actually charged.
    /// </summary>
    public LocalizedText NameSnapshot { get; set; } = LocalizedText.Empty;
    public int UnitPriceMinor { get; set; }

    public int Quantity { get; set; } = 1;

    /// <summary>Chosen modifier options, snapshotted as jsonb — a record, never queried structurally.</summary>
    public string SelectedOptionsJson { get; set; } = "[]";

    public int LineTotalMinor { get; set; }
    public string? Note { get; set; }
}

public sealed class WaiterCall
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid CafeTableId { get; set; }
    public CafeTable? CafeTable { get; set; }
    public WaiterCallReason Reason { get; set; } = WaiterCallReason.Assistance;
    public string? Note { get; set; }
    public ServiceCallStatus Status { get; set; } = ServiceCallStatus.Open;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AcknowledgedAt { get; set; }
    public string? AcknowledgedBy { get; set; }
}

public sealed class BillRequest
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid CafeTableId { get; set; }
    public CafeTable? CafeTable { get; set; }
    public PaymentMethod Method { get; set; } = PaymentMethod.Card;
    public int? SplitWays { get; set; }
    public ServiceCallStatus Status { get; set; } = ServiceCallStatus.Open;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? AcknowledgedAt { get; set; }
}

public sealed class Feedback
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid? CafeTableId { get; set; }
    public CafeTable? CafeTable { get; set; }
    public Guid? OrderId { get; set; }
    public int Rating { get; set; }
    public string[] Compliments { get; set; } = [];
    public string? Comment { get; set; }
    public string Locale { get; set; } = "tr";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

/// <summary>Key/value settings so the pass-2 admin can drive Wi-Fi, hours,
/// address and socials without a deploy.</summary>
public sealed class CafeSetting
{
    public string Key { get; set; } = string.Empty;
    public string ValueJson { get; set; } = "{}";
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Announcement
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public LocalizedText Title { get; set; } = LocalizedText.Empty;
    public LocalizedText Body { get; set; } = LocalizedText.Empty;
    public string? ImageUrl { get; set; }
    public DateTimeOffset? StartsAt { get; set; }
    public DateTimeOffset? EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
}
