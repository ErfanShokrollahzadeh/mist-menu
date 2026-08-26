using Mist.Domain.Enums;

namespace Mist.Domain.Entities;

public sealed class StaffUser
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    /// <summary>PBKDF2-SHA256, stored as iterations.salt.hash — see PasswordHasher.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    public StaffRole Role { get; set; } = StaffRole.Staff;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}

public sealed class RefreshToken
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid StaffUserId { get; set; }
    public StaffUser? StaffUser { get; set; }

    /// <summary>SHA-256 of the token. The raw value is shown to the client once
    /// and never stored, so a database leak does not hand over live sessions.</summary>
    public string TokenHash { get; set; } = string.Empty;

    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? RevokedAt { get; set; }

    /// <summary>Set when this token is rotated, so a replayed token reveals theft.</summary>
    public Guid? ReplacedByTokenId { get; set; }

    public bool IsActive => RevokedAt is null && DateTimeOffset.UtcNow < ExpiresAt;
}

/// <summary>Audit trail for order status changes. Doubles as the source for
/// time-in-state analytics, which cannot be derived from Order alone.</summary>
public sealed class OrderStatusEvent
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrderId { get; set; }
    public Order? Order { get; set; }
    public OrderStatus? FromStatus { get; set; }
    public OrderStatus ToStatus { get; set; }
    public Guid? ChangedByStaffUserId { get; set; }
    public string? ChangedByName { get; set; }
    public DateTimeOffset ChangedAt { get; set; } = DateTimeOffset.UtcNow;
}
