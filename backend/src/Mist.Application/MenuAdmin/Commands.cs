using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Application.MenuAdmin;

public sealed record UpsertItemInput(
    string? Slug,              // null creates
    string CategorySlug,
    LocalizedDto Name,
    LocalizedDto Description,
    int PriceMinor,
    string? ImageUrl,
    IReadOnlyList<string> Tags,
    IReadOnlyList<string> Allergens,
    int? Calories,
    bool IsAvailable);

public sealed record UpsertItemCommand(UpsertItemInput Input) : IRequest<MenuItemDto>;

public sealed class UpsertItemHandler(IMenuWriter writer, IMenuCache cache)
    : IRequestHandler<UpsertItemCommand, MenuItemDto>
{
    public async Task<MenuItemDto> Handle(UpsertItemCommand request, CancellationToken ct)
    {
        var input = request.Input;

        if (string.IsNullOrWhiteSpace(input.Name.Tr))
            throw new ArgumentException("A Turkish name is required.", nameof(request));
        if (input.PriceMinor <= 0)
            throw new ArgumentOutOfRangeException(nameof(request), "Price must be greater than zero.");
        if (input.Calories is < 0)
            throw new ArgumentOutOfRangeException(nameof(request), "Calories cannot be negative.");

        var saved = await writer.UpsertItemAsync(input, ct);
        // Without this the edit is invisible for up to the cache TTL, and staff
        // reasonably conclude the CMS is broken.
        await cache.InvalidateAsync(ct);
        return saved;
    }
}

public sealed record SetItemAvailabilityCommand(string CategorySlug, string Slug, bool IsAvailable)
    : IRequest<MenuItemDto>;

public sealed class SetItemAvailabilityHandler(IMenuWriter writer, IMenuCache cache)
    : IRequestHandler<SetItemAvailabilityCommand, MenuItemDto>
{
    public async Task<MenuItemDto> Handle(SetItemAvailabilityCommand request, CancellationToken ct)
    {
        var saved = await writer.SetAvailabilityAsync(
            request.CategorySlug, request.Slug, request.IsAvailable, ct);
        await cache.InvalidateAsync(ct);
        return saved;
    }
}

public sealed record DeleteItemCommand(string CategorySlug, string Slug) : IRequest<bool>;

public sealed class DeleteItemHandler(IMenuWriter writer, IMenuCache cache)
    : IRequestHandler<DeleteItemCommand, bool>
{
    public async Task<bool> Handle(DeleteItemCommand request, CancellationToken ct)
    {
        var removed = await writer.DeleteItemAsync(request.CategorySlug, request.Slug, ct);
        if (removed) await cache.InvalidateAsync(ct);
        return removed;
    }
}

public sealed record ReorderItemsCommand(string CategorySlug, IReadOnlyList<string> SlugsInOrder)
    : IRequest<int>;

public sealed class ReorderItemsHandler(IMenuWriter writer, IMenuCache cache)
    : IRequestHandler<ReorderItemsCommand, int>
{
    public async Task<int> Handle(ReorderItemsCommand request, CancellationToken ct)
    {
        if (request.SlugsInOrder.Count == 0)
            throw new ArgumentException("No items supplied.", nameof(request));
        if (request.SlugsInOrder.Distinct().Count() != request.SlugsInOrder.Count)
            throw new ArgumentException("Duplicate slugs in the ordering.", nameof(request));

        var updated = await writer.ReorderAsync(request.CategorySlug, request.SlugsInOrder, ct);
        await cache.InvalidateAsync(ct);
        return updated;
    }
}

public interface IMenuWriter
{
    Task<MenuItemDto> UpsertItemAsync(UpsertItemInput input, CancellationToken ct);
    Task<MenuItemDto> SetAvailabilityAsync(string categorySlug, string slug, bool isAvailable, CancellationToken ct);
    Task<bool> DeleteItemAsync(string categorySlug, string slug, CancellationToken ct);
    Task<int> ReorderAsync(string categorySlug, IReadOnlyList<string> slugsInOrder, CancellationToken ct);
}
