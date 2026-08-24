using Microsoft.EntityFrameworkCore;
using Mist.Application.Contracts;
using Mist.Application.Menu;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

public sealed class MenuReader(MistDbContext db) : IMenuReader
{
    public async Task<MenuDocumentDto> ReadAsync(CancellationToken ct)
    {
        var groups = await db.MenuGroups.AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .Select(g => new MenuGroupDto(g.Slug, new LocalizedDto(g.Name.Tr, g.Name.En), g.Icon, g.SortOrder))
            .ToListAsync(ct);

        var categories = await db.Categories.AsNoTracking()
            .Include(c => c.MenuGroup)
            .Include(c => c.Items).ThenInclude(i => i.ModifierGroups).ThenInclude(g => g.Options)
            .OrderBy(c => c.SortOrder)
            .ToListAsync(ct);

        var mapped = categories.Select(c => new CategoryDto(
            c.Slug,
            c.MenuGroup!.Slug,
            new LocalizedDto(c.Name.Tr, c.Name.En),
            c.Icon,
            c.ImageUrl,
            c.SortOrder,
            c.Items.OrderBy(i => i.SortOrder).Select(i => new MenuItemDto(
                i.Slug, c.Slug,
                new LocalizedDto(i.Name.Tr, i.Name.En),
                new LocalizedDto(i.Description.Tr, i.Description.En),
                i.PriceMinor, i.ImageUrl,
                new LocalizedDto(i.ImageAlt.Tr, i.ImageAlt.En),
                i.Tags, i.Allergens, i.Calories, i.IsAvailable, i.SortOrder,
                i.ModifierGroups.OrderBy(g => g.SortOrder).Select(g => new ModifierGroupDto(
                    g.Slug, new LocalizedDto(g.Name.Tr, g.Name.En),
                    g.Selection.ToString().ToLowerInvariant(), g.IsRequired,
                    g.MinSelect, g.MaxSelect, g.SortOrder,
                    g.Options.OrderBy(o => o.SortOrder).Select(o => new ModifierOptionDto(
                        o.Slug, new LocalizedDto(o.Name.Tr, o.Name.En),
                        o.PriceDeltaMinor, o.IsDefault, o.IsAvailable, o.SortOrder)).ToList()
                )).ToList()
            )).ToList()
        )).ToList();

        return new MenuDocumentDto(
            "1.0.0", DateTimeOffset.UtcNow, "TRY",
            // The source data carries neither; the UI states that rather than
            // implying an item has no allergens.
            AllergenDataAvailable: false,
            CalorieDataAvailable: false,
            groups, mapped);
    }
}
