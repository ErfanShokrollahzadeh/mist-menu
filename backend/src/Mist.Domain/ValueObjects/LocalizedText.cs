namespace Mist.Domain.ValueObjects;

/// <summary>
/// Every customer-visible string carries both languages together.
/// Mapped as an EF owned type to two columns (name_tr, name_en) rather than
/// jsonb, so Postgres can index them for server-side search later.
/// </summary>
public sealed class LocalizedText
{
    public string Tr { get; private set; } = string.Empty;
    public string En { get; private set; } = string.Empty;

    private LocalizedText() { }

    public LocalizedText(string tr, string en)
    {
        Tr = tr ?? throw new ArgumentNullException(nameof(tr));
        En = string.IsNullOrWhiteSpace(en) ? tr : en;
    }

    public string For(string locale) =>
        locale.Equals("en", StringComparison.OrdinalIgnoreCase) ? En : Tr;

    public static LocalizedText Empty => new(string.Empty, string.Empty);
}
