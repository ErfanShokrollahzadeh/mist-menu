namespace Mist.Application.Contracts;

/* Shapes mirror src/types/menu.ts on the frontend, so the same
   data/menu.source.json round-trips through either path unchanged. */

public sealed record LocalizedDto(string Tr, string En);

public sealed record ModifierOptionDto(
    string Slug, LocalizedDto Name, int PriceDeltaMinor,
    bool IsDefault, bool IsAvailable, int SortOrder);

public sealed record ModifierGroupDto(
    string Slug, LocalizedDto Name, string Selection, bool IsRequired,
    int MinSelect, int MaxSelect, int SortOrder, IReadOnlyList<ModifierOptionDto> Options);

public sealed record MenuItemDto(
    string Slug, string CategorySlug, LocalizedDto Name, LocalizedDto Description,
    int PriceMinor, string? ImageUrl, LocalizedDto ImageAlt,
    IReadOnlyList<string> Tags, IReadOnlyList<string> Allergens, int? Calories,
    bool IsAvailable, int SortOrder, IReadOnlyList<ModifierGroupDto> ModifierGroups);

public sealed record CategoryDto(
    string Slug, string GroupSlug, LocalizedDto Name, string Icon,
    string? ImageUrl, int SortOrder, IReadOnlyList<MenuItemDto> Items);

public sealed record MenuGroupDto(string Slug, LocalizedDto Name, string Icon, int SortOrder);

public sealed record MenuDocumentDto(
    string Version, DateTimeOffset GeneratedAt, string Currency,
    bool AllergenDataAvailable, bool CalorieDataAvailable,
    IReadOnlyList<MenuGroupDto> Groups, IReadOnlyList<CategoryDto> Categories);

public sealed record OrderLineInput(
    string CategorySlug, string ItemSlug, int Quantity,
    Dictionary<string, List<string>> Selections, string? Note);

public sealed record PlaceOrderInput(
    string TableId, string Locale, IReadOnlyList<OrderLineInput> Lines,
    string? Note, string ClientRequestId);

public sealed record OrderLineDto(
    string CategorySlug, string ItemSlug, LocalizedDto Name,
    int Quantity, int UnitPriceMinor, int LineTotalMinor,
    IReadOnlyList<LocalizedDto> SelectedOptions, string? Note);

public sealed record OrderDto(
    Guid Id, string OrderNumber, string TableId, string Status,
    int TotalMinor, DateTimeOffset PlacedAt, IReadOnlyList<OrderLineDto> Lines)
{
    /// <summary>Always false from the API. The frontend's mock adapter sets it
    /// true so the UI can say the order never reached a kitchen.</summary>
    public bool Simulated => false;
}

public sealed record WaiterCallInput(string TableId, string Reason, string? Note);
public sealed record WaiterCallDto(Guid Id, string TableId, string Reason, DateTimeOffset CreatedAt);

public sealed record BillRequestInput(string TableId, string Method, int? SplitWays);
public sealed record BillRequestDto(Guid Id, string TableId, string Method, int? SplitWays, DateTimeOffset CreatedAt);

public sealed record FeedbackInput(
    string? TableId, int Rating, IReadOnlyList<string> Compliments, string? Comment, string Locale);
public sealed record FeedbackDto(Guid Id, DateTimeOffset CreatedAt);

public sealed record CafeSettingsDto(IReadOnlyDictionary<string, object> Values);
