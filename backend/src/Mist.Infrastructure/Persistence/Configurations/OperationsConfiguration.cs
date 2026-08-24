using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mist.Domain.Entities;

namespace Mist.Infrastructure.Persistence.Configurations;

public sealed class CafeTableConfiguration : IEntityTypeConfiguration<CafeTable>
{
    public void Configure(EntityTypeBuilder<CafeTable> b)
    {
        b.ToTable("tables");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Number).IsUnique();
        b.HasIndex(x => x.QrToken).IsUnique();
        b.Property(x => x.Number).HasMaxLength(16).IsRequired();
        b.Property(x => x.QrToken).HasMaxLength(64).IsRequired();
    }
}

public sealed class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> b)
    {
        b.ToTable("orders");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.OrderNumber).IsUnique();
        // Enforces idempotency at the database, not just in the handler.
        b.HasIndex(x => x.ClientRequestId).IsUnique();
        b.HasIndex(x => new { x.CafeTableId, x.Status });
        b.Property(x => x.OrderNumber).HasMaxLength(16).IsRequired();
        b.Property(x => x.ClientRequestId).HasMaxLength(64).IsRequired();
        b.Property(x => x.Locale).HasMaxLength(8).IsRequired();
        b.Property(x => x.Note).HasMaxLength(500);
        b.HasOne(x => x.CafeTable).WithMany(t => t.Orders)
            .HasForeignKey(x => x.CafeTableId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> b)
    {
        b.ToTable("order_items");
        b.HasKey(x => x.Id);
        b.Property(x => x.SelectedOptionsJson).HasColumnType("jsonb").IsRequired();
        b.Property(x => x.Note).HasMaxLength(300);
        b.OwnsOne(x => x.NameSnapshot, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(200).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(200).IsRequired();
        });
        b.Navigation(x => x.NameSnapshot).IsRequired();
        b.HasOne(x => x.Order).WithMany(o => o.Items)
            .HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.MenuItem).WithMany()
            .HasForeignKey(x => x.MenuItemId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class WaiterCallConfiguration : IEntityTypeConfiguration<WaiterCall>
{
    public void Configure(EntityTypeBuilder<WaiterCall> b)
    {
        b.ToTable("waiter_calls");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CafeTableId, x.Status });
        b.Property(x => x.Note).HasMaxLength(300);
        b.Property(x => x.AcknowledgedBy).HasMaxLength(120);
        b.HasOne(x => x.CafeTable).WithMany(t => t.WaiterCalls)
            .HasForeignKey(x => x.CafeTableId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class BillRequestConfiguration : IEntityTypeConfiguration<BillRequest>
{
    public void Configure(EntityTypeBuilder<BillRequest> b)
    {
        b.ToTable("bill_requests");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CafeTableId, x.Status });
        b.HasOne(x => x.CafeTable).WithMany(t => t.BillRequests)
            .HasForeignKey(x => x.CafeTableId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
{
    public void Configure(EntityTypeBuilder<Feedback> b)
    {
        b.ToTable("feedback");
        b.HasKey(x => x.Id);
        b.Property(x => x.Compliments).HasColumnType("text[]");
        b.Property(x => x.Comment).HasMaxLength(1000);
        b.Property(x => x.Locale).HasMaxLength(8).IsRequired();
        b.HasOne(x => x.CafeTable).WithMany()
            .HasForeignKey(x => x.CafeTableId).OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class CafeSettingConfiguration : IEntityTypeConfiguration<CafeSetting>
{
    public void Configure(EntityTypeBuilder<CafeSetting> b)
    {
        b.ToTable("settings");
        b.HasKey(x => x.Key);
        b.Property(x => x.Key).HasMaxLength(64);
        b.Property(x => x.ValueJson).HasColumnType("jsonb").IsRequired();
    }
}

public sealed class AnnouncementConfiguration : IEntityTypeConfiguration<Announcement>
{
    public void Configure(EntityTypeBuilder<Announcement> b)
    {
        b.ToTable("announcements");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Slug).IsUnique();
        b.Property(x => x.Slug).HasMaxLength(96).IsRequired();
        b.Property(x => x.ImageUrl).HasMaxLength(512);
        b.OwnsOne(x => x.Title, n =>
        {
            n.Property(p => p.Tr).HasColumnName("title_tr").HasMaxLength(200).IsRequired();
            n.Property(p => p.En).HasColumnName("title_en").HasMaxLength(200).IsRequired();
        });
        b.OwnsOne(x => x.Body, n =>
        {
            n.Property(p => p.Tr).HasColumnName("body_tr").HasMaxLength(2000).IsRequired();
            n.Property(p => p.En).HasColumnName("body_en").HasMaxLength(2000).IsRequired();
        });
        b.Navigation(x => x.Title).IsRequired();
        b.Navigation(x => x.Body).IsRequired();
    }
}
