using Microsoft.EntityFrameworkCore;
using Mist.Application.Contracts;
using Mist.Application.MenuAdmin;
using Mist.Domain.Entities;
using Mist.Domain.ValueObjects;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Repositories;

public sealed class MenuWriter(MistDbContext db) : IMenuWriter
{
    public async Task<MenuItemDto> UpsertItemAsync(UpsertItemInput input, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Slug == input.CategorySlug, ct)
            ?? throw new InvalidOperationException($"Unknown category '{input.CategorySlug}'.");

        MenuItem item;
        if (string.IsNullOrWhiteSpace(input.Slug))
        {
            var slug = Slugify(input.Name.Tr);
            if (await db.MenuItems.AnyAsync(i => i.CategoryId == category.Id && i.Slug == slug, ct))
                throw new ArgumentException(
                    $"'{input.Name.Tr}' already exists in this category.", nameof(input));

            item = new MenuItem
            {
                Slug = slug,
                CategoryId = category.Id,
                // New items land at the end rather than silently displacing others.
                SortOrder = await db.MenuItems.CountAsync(i => i.CategoryId == category.Id, ct),
            };
            db.MenuItems.Add(item);
        }
        else
        {
            item = await db.MenuItems
                .FirstOrDefaultAsync(i => i.CategoryId == category.Id && i.Slug == input.Slug, ct)
                ?? throw new InvalidOperationException(
                    $"Unknown item '{input.CategorySlug}/{input.Slug}'.");
        }

        item.Name = new LocalizedText(input.Name.Tr, input.Name.En);
        item.Description = new LocalizedText(input.Description.Tr, input.Description.En);
        item.PriceMinor = input.PriceMinor;
        item.ImageUrl = string.IsNullOrWhiteSpace(input.ImageUrl) ? null : input.ImageUrl;
        item.ImageAlt = new LocalizedText(input.Name.Tr, input.Name.En);
        item.Tags = input.Tags.ToArray();
        item.Allergens = input.Allergens.ToArray();
        item.Calories = input.Calories;
        item.IsAvailable = input.IsAvailable;

        await db.SaveChangesAsync(ct);
        return await ReadAsync(category.Slug, item.Slug, ct);
    }

    public async Task<MenuItemDto> SetAvailabilityAsync(
        string categorySlug, string slug, bool isAvailable, CancellationToken ct)
    {
        var item = await Find(categorySlug, slug, ct);
        item.IsAvailable = isAvailable;
        await db.SaveChangesAsync(ct);
        return await ReadAsync(categorySlug, slug, ct);
    }

    public async Task<bool> DeleteItemAsync(string categorySlug, string slug, CancellationToken ct)
    {
        var item = await Find(categorySlug, slug, ct);

        // An item named on a past order is history. Deleting it would orphan the
        // order line's foreign key, so it is retired from the menu instead.
        if (await db.OrderItems.AnyAsync(oi => oi.MenuItemId == item.Id, ct))
            throw new ArgumentException(
                "This item appears on past orders and cannot be deleted. Mark it sold out instead.",
                nameof(slug));

        db.MenuItems.Remove(item);
        await db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<int> ReorderAsync(
        string categorySlug, IReadOnlyList<string> slugsInOrder, CancellationToken ct)
    {
        var category = await db.Categories.FirstOrDefaultAsync(c => c.Slug == categorySlug, ct)
            ?? throw new InvalidOperationException($"Unknown category '{categorySlug}'.");

        var items = await db.MenuItems
            .Where(i => i.CategoryId == category.Id)
            .ToDictionaryAsync(i => i.Slug, ct);

        var missing = slugsInOrder.Where(s => !items.ContainsKey(s)).ToList();
        if (missing.Count > 0)
            throw new InvalidOperationException(
                $"Unknown item(s) in this category: {string.Join(", ", missing)}.");

        for (var i = 0; i < slugsInOrder.Count; i++)
            items[slugsInOrder[i]].SortOrder = i;

        await db.SaveChangesAsync(ct);
        return slugsInOrder.Count;
    }

    private async Task<MenuItem> Find(string categorySlug, string slug, CancellationToken ct) =>
        await db.MenuItems
            .Include(i => i.Category)
            .FirstOrDefaultAsync(i => i.Category!.Slug == categorySlug && i.Slug == slug, ct)
        ?? throw new InvalidOperationException($"Unknown item '{categorySlug}/{slug}'.");

    private async Task<MenuItemDto> ReadAsync(string categorySlug, string slug, CancellationToken ct)
    {
        var i = await db.MenuItems.AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.ModifierGroups).ThenInclude(g => g.Options)
            .FirstAsync(x => x.Category!.Slug == categorySlug && x.Slug == slug, ct);

        return new MenuItemDto(
            i.Slug, categorySlug,
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
                    o.PriceDeltaMinor, o.IsDefault, o.IsAvailable, o.SortOrder)).ToList())).ToList());
    }

    /// <summary>Turkish-aware, matching the codemod that generated the seed slugs.</summary>
    private static string Slugify(string input)
    {
        var map = new Dictionary<char, char>
        {
            ['ı'] = 'i', ['İ'] = 'i', ['ş'] = 's', ['Ş'] = 's', ['ğ'] = 'g', ['Ğ'] = 'g',
            ['ü'] = 'u', ['Ü'] = 'u', ['ö'] = 'o', ['Ö'] = 'o', ['ç'] = 'c', ['Ç'] = 'c',
        };
        var lowered = string.Concat(input.Select(c => map.TryGetValue(c, out var r) ? r : c))
            .ToLowerInvariant();
        var slug = new string(lowered.Select(c => char.IsLetterOrDigit(c) ? c : '-').ToArray());
        while (slug.Contains("--")) slug = slug.Replace("--", "-");
        return slug.Trim('-');
    }
}
