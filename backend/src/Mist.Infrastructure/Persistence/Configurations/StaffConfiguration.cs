using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mist.Domain.Entities;

namespace Mist.Infrastructure.Persistence.Configurations;

public sealed class StaffUserConfiguration : IEntityTypeConfiguration<StaffUser>
{
    public void Configure(EntityTypeBuilder<StaffUser> b)
    {
        b.ToTable("staff_users");
        b.HasKey(x => x.Id);
        // Email is stored lowercase by StaffDirectory; unique so two accounts
        // cannot shadow each other.
        b.HasIndex(x => x.Email).IsUnique();
        b.Property(x => x.Email).HasMaxLength(256).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
        b.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("refresh_tokens");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.TokenHash).IsUnique();
        b.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        b.Ignore(x => x.IsActive);   // computed, not stored
        b.HasOne(x => x.StaffUser).WithMany(u => u.RefreshTokens)
            .HasForeignKey(x => x.StaffUserId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class OrderStatusEventConfiguration : IEntityTypeConfiguration<OrderStatusEvent>
{
    public void Configure(EntityTypeBuilder<OrderStatusEvent> b)
    {
        b.ToTable("order_status_events");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.OrderId, x.ChangedAt });
        b.Property(x => x.ChangedByName).HasMaxLength(120);
        b.HasOne(x => x.Order).WithMany()
            .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
    }
}
