using Microsoft.EntityFrameworkCore;
using Mist.Domain.Entities;

namespace Mist.Infrastructure.Persistence;

public sealed class MistDbContext(DbContextOptions<MistDbContext> options) : DbContext(options)
{
    public DbSet<MenuGroup> MenuGroups => Set<MenuGroup>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<MenuItem> MenuItems => Set<MenuItem>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<ModifierOption> ModifierOptions => Set<ModifierOption>();
    public DbSet<CafeTable> Tables => Set<CafeTable>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<WaiterCall> WaiterCalls => Set<WaiterCall>();
    public DbSet<BillRequest> BillRequests => Set<BillRequest>();
    public DbSet<Feedback> Feedback => Set<Feedback>();
    public DbSet<CafeSetting> Settings => Set<CafeSetting>();
    public DbSet<Announcement> Announcements => Set<Announcement>();
    public DbSet<StaffUser> StaffUsers => Set<StaffUser>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OrderStatusEvent> OrderStatusEvents => Set<OrderStatusEvent>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.ApplyConfigurationsFromAssembly(typeof(MistDbContext).Assembly);

        // Enums as text so a migration diff stays readable and a DBA can query it.
        foreach (var entity in b.Model.GetEntityTypes())
            foreach (var property in entity.GetProperties())
                if (property.ClrType.IsEnum ||
                    (Nullable.GetUnderlyingType(property.ClrType)?.IsEnum ?? false))
                    property.SetProviderClrType(typeof(string));

        base.OnModelCreating(b);
    }
}
