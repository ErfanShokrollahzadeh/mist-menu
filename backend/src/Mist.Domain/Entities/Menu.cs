using Mist.Domain.Enums;
using Mist.Domain.ValueObjects;

namespace Mist.Domain.Entities;

public sealed class MenuGroup
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public LocalizedText Name { get; set; } = LocalizedText.Empty;
    public string Icon { get; set; } = string.Empty;
    public int SortOrder { get; set; }

    public ICollection<Category> Categories { get; set; } = [];
}

public sealed class Category
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public Guid MenuGroupId { get; set; }
    public MenuGroup? MenuGroup { get; set; }
    public LocalizedText Name { get; set; } = LocalizedText.Empty;
    public string Icon { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<MenuItem> Items { get; set; } = [];
}

public sealed class MenuItem
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public Category? Category { get; set; }

    public LocalizedText Name { get; set; } = LocalizedText.Empty;
    public LocalizedText Description { get; set; } = LocalizedText.Empty;

    /// <summary>Price in kurus. Integer throughout — a split bill must not
    /// accumulate float rounding error on a customer's receipt.</summary>
    public int PriceMinor { get; set; }

    public string? ImageUrl { get; set; }
    public LocalizedText ImageAlt { get; set; } = LocalizedText.Empty;

    public string[] Tags { get; set; } = [];

    /// <summary>Empty until the cafe supplies real data. Never inferred:
    /// an allergen list is a food-safety claim, not a UI detail.</summary>
    public string[] Allergens { get; set; } = [];

    public int? Calories { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; }

    public ICollection<ModifierGroup> ModifierGroups { get; set; } = [];
}

public sealed class ModifierGroup
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public Guid MenuItemId { get; set; }
    public MenuItem? MenuItem { get; set; }
    public LocalizedText Name { get; set; } = LocalizedText.Empty;
    public ModifierSelection Selection { get; set; } = ModifierSelection.Single;
    public bool IsRequired { get; set; }
    public int MinSelect { get; set; }
    public int MaxSelect { get; set; } = 1;
    public int SortOrder { get; set; }

    public ICollection<ModifierOption> Options { get; set; } = [];
}

public sealed class ModifierOption
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public string Slug { get; set; } = string.Empty;
    public Guid ModifierGroupId { get; set; }
    public ModifierGroup? ModifierGroup { get; set; }
    public LocalizedText Name { get; set; } = LocalizedText.Empty;
    public int PriceDeltaMinor { get; set; }
    public bool IsDefault { get; set; }
    public bool IsAvailable { get; set; } = true;
    public int SortOrder { get; set; }
}
