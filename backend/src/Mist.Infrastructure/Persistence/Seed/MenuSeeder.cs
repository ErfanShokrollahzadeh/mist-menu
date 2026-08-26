using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Mist.Domain.Entities;
using Mist.Domain.Enums;
using Mist.Domain.ValueObjects;

namespace Mist.Infrastructure.Persistence.Seed;

/// <summary>
/// Seeds from data/menu.source.json — the same file the frontend's static
/// adapter imports. Sharing one source is what makes mock data and database
/// content agree by construction rather than by discipline.
/// </summary>
public sealed class MenuSeeder(MistDbContext db, ILogger<MenuSeeder> logger)
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);

    public async Task SeedAsync(string sourcePath, CancellationToken ct = default)
    {
        if (!File.Exists(sourcePath))
            throw new FileNotFoundException($"Menu source not found at {sourcePath}", sourcePath);

        var doc = JsonSerializer.Deserialize<SourceDocument>(
            await File.ReadAllTextAsync(sourcePath, ct), Json)
            ?? throw new InvalidOperationException("Menu source could not be parsed.");

        if (await db.MenuGroups.AnyAsync(ct))
        {
            logger.LogInformation("Menu already seeded; skipping.");
        }
        else
        {
            var groups = doc.Groups.Select(g => new MenuGroup
            {
                Slug = g.Slug, Icon = g.Icon, SortOrder = g.SortOrder,
                Name = new LocalizedText(g.Name.Tr, g.Name.En),
            }).ToList();
            db.MenuGroups.AddRange(groups);

            var groupBySlug = groups.ToDictionary(g => g.Slug);

            foreach (var c in doc.Categories)
            {
                var category = new Category
                {
                    Slug = c.Slug, Icon = c.Icon, SortOrder = c.SortOrder,
                    Name = new LocalizedText(c.Name.Tr, c.Name.En),
                    MenuGroupId = groupBySlug[c.GroupSlug].Id,
                };
                db.Categories.Add(category);

                foreach (var i in c.Items)
                {
                    var item = new MenuItem
                    {
                        Slug = i.Slug, CategoryId = category.Id,
                        Name = new LocalizedText(i.Name.Tr, i.Name.En),
                        Description = new LocalizedText(i.Description.Tr, i.Description.En),
                        PriceMinor = i.PriceMinor,
                        ImageUrl = string.IsNullOrWhiteSpace(i.Image.Src) ? null : i.Image.Src,
                        ImageAlt = new LocalizedText(i.Image.Alt.Tr, i.Image.Alt.En),
                        Tags = i.Tags.ToArray(),
                        Allergens = i.Allergens.ToArray(),
                        Calories = i.Calories,
                        IsAvailable = i.IsAvailable,
                        SortOrder = i.SortOrder,
                    };
                    db.MenuItems.Add(item);

                    foreach (var g in i.ModifierGroups)
                    {
                        var group = new ModifierGroup
                        {
                            Slug = g.Slug, MenuItemId = item.Id,
                            Name = new LocalizedText(g.Name.Tr, g.Name.En),
                            Selection = g.Selection == "multiple"
                                ? ModifierSelection.Multiple : ModifierSelection.Single,
                            IsRequired = g.IsRequired, MinSelect = g.MinSelect,
                            MaxSelect = g.MaxSelect, SortOrder = g.SortOrder,
                        };
                        db.ModifierGroups.Add(group);

                        foreach (var o in g.Options)
                            db.ModifierOptions.Add(new ModifierOption
                            {
                                Slug = o.Slug, ModifierGroupId = group.Id,
                                Name = new LocalizedText(o.Name.Tr, o.Name.En),
                                PriceDeltaMinor = o.PriceDeltaMinor,
                                IsDefault = o.IsDefault, IsAvailable = o.IsAvailable,
                                SortOrder = o.SortOrder,
                            });
                    }
                }
            }

            await db.SaveChangesAsync(ct);
            logger.LogInformation(
                "Seeded {Groups} groups, {Categories} categories, {Items} items.",
                doc.Groups.Count, doc.Categories.Count, doc.Categories.Sum(c => c.Items.Count));
        }

        await SeedTablesAsync(ct);
    }

    /// <summary>Tables carry an unguessable QR token rather than a bare number,
    /// so a customer cannot order to someone else's table by editing the URL.</summary>
    private async Task SeedTablesAsync(CancellationToken ct)
    {
        if (await db.Tables.AnyAsync(ct)) return;

        var layout = new (TableZone Zone, int From, int To)[]
        {
            (TableZone.Indoor, 1, 14), (TableZone.Terrace, 15, 24), (TableZone.Garden, 25, 32),
        };

        foreach (var (zone, from, to) in layout)
            for (var n = from; n <= to; n++)
                db.Tables.Add(new CafeTable { Number = n.ToString(), Zone = zone });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded {Count} tables.", layout.Sum(l => l.To - l.From + 1));
    }

    /* Mirrors data/menu.source.json. */
    private sealed record Loc(string Tr, string En);
    private sealed record Img(string Source, string Src, Loc Alt);
    private sealed record Opt(string Slug, Loc Name, int PriceDeltaMinor, bool IsDefault, bool IsAvailable, int SortOrder);
    private sealed record Grp(string Slug, Loc Name, string Selection, bool IsRequired, int MinSelect, int MaxSelect, int SortOrder, List<Opt> Options);
    private sealed record Itm(string Slug, string CategorySlug, Loc Name, Loc Description, int PriceMinor,
        Img Image, List<string> Tags, List<string> Allergens, int? Calories,
        List<Grp> ModifierGroups, bool IsAvailable, int SortOrder);
    private sealed record Cat(string Slug, string GroupSlug, Loc Name, string Icon, int SortOrder, List<Itm> Items);
    private sealed record Grp2(string Slug, Loc Name, string Icon, int SortOrder);
    private sealed record SourceDocument(string Version, string Currency,
        bool AllergenDataAvailable, bool CalorieDataAvailable, List<Grp2> Groups, List<Cat> Categories);
}
