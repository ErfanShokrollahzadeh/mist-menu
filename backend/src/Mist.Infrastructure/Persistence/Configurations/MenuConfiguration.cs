using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Mist.Domain.Entities;

namespace Mist.Infrastructure.Persistence.Configurations;

public sealed class MenuGroupConfiguration : IEntityTypeConfiguration<MenuGroup>
{
    public void Configure(EntityTypeBuilder<MenuGroup> b)
    {
        b.ToTable("menu_groups");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Slug).IsUnique();
        b.Property(x => x.Slug).HasMaxLength(64).IsRequired();
        b.Property(x => x.Icon).HasMaxLength(16);
        // Owned -> name_tr / name_en columns, indexable for server-side search.
        b.OwnsOne(x => x.Name, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(160).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(160).IsRequired();
        });
        b.Navigation(x => x.Name).IsRequired();
    }
}

public sealed class CategoryConfiguration : IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> b)
    {
        b.ToTable("categories");
        b.HasKey(x => x.Id);
        b.HasIndex(x => x.Slug).IsUnique();
        b.Property(x => x.Slug).HasMaxLength(64).IsRequired();
        b.Property(x => x.Icon).HasMaxLength(16);
        b.OwnsOne(x => x.Name, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(160).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(160).IsRequired();
        });
        b.Navigation(x => x.Name).IsRequired();
        b.HasOne(x => x.MenuGroup).WithMany(g => g.Categories)
            .HasForeignKey(x => x.MenuGroupId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class MenuItemConfiguration : IEntityTypeConfiguration<MenuItem>
{
    public void Configure(EntityTypeBuilder<MenuItem> b)
    {
        b.ToTable("menu_items");
        b.HasKey(x => x.Id);
        b.HasIndex(x => new { x.CategoryId, x.Slug }).IsUnique();
        b.Property(x => x.Slug).HasMaxLength(96).IsRequired();
        b.Property(x => x.PriceMinor).IsRequired();
        b.Property(x => x.ImageUrl).HasMaxLength(512);
        // Npgsql maps string[] to text[] natively.
        b.Property(x => x.Tags).HasColumnType("text[]");
        b.Property(x => x.Allergens).HasColumnType("text[]");

        b.OwnsOne(x => x.Name, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(200).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(200).IsRequired();
        });
        b.OwnsOne(x => x.Description, n =>
        {
            n.Property(p => p.Tr).HasColumnName("description_tr").HasMaxLength(2000);
            n.Property(p => p.En).HasColumnName("description_en").HasMaxLength(2000);
        });
        b.OwnsOne(x => x.ImageAlt, n =>
        {
            n.Property(p => p.Tr).HasColumnName("image_alt_tr").HasMaxLength(300);
            n.Property(p => p.En).HasColumnName("image_alt_en").HasMaxLength(300);
        });
        b.Navigation(x => x.Name).IsRequired();
        b.Navigation(x => x.Description).IsRequired();
        b.Navigation(x => x.ImageAlt).IsRequired();

        b.HasOne(x => x.Category).WithMany(c => c.Items)
            .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ModifierGroupConfiguration : IEntityTypeConfiguration<ModifierGroup>
{
    public void Configure(EntityTypeBuilder<ModifierGroup> b)
    {
        b.ToTable("modifier_groups");
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).HasMaxLength(128).IsRequired();
        b.OwnsOne(x => x.Name, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(120).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(120).IsRequired();
        });
        b.Navigation(x => x.Name).IsRequired();
        b.HasOne(x => x.MenuItem).WithMany(i => i.ModifierGroups)
            .HasForeignKey(x => x.MenuItemId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ModifierOptionConfiguration : IEntityTypeConfiguration<ModifierOption>
{
    public void Configure(EntityTypeBuilder<ModifierOption> b)
    {
        b.ToTable("modifier_options");
        b.HasKey(x => x.Id);
        b.Property(x => x.Slug).HasMaxLength(128).IsRequired();
        b.OwnsOne(x => x.Name, n =>
        {
            n.Property(p => p.Tr).HasColumnName("name_tr").HasMaxLength(160).IsRequired();
            n.Property(p => p.En).HasColumnName("name_en").HasMaxLength(160).IsRequired();
        });
        b.Navigation(x => x.Name).IsRequired();
        b.HasOne(x => x.ModifierGroup).WithMany(g => g.Options)
            .HasForeignKey(x => x.ModifierGroupId).OnDelete(DeleteBehavior.Cascade);
    }
}
