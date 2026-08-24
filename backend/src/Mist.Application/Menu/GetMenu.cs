using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Application.Menu;

public sealed record GetMenuQuery : IRequest<MenuDocumentDto>;

/// <summary>Reads through the cache. The whole bilingual document is cached
/// under one key and projected per-locale on the way out, so one entry serves
/// both languages.</summary>
public sealed class GetMenuHandler(IMenuCache cache, IMenuReader reader)
    : IRequestHandler<GetMenuQuery, MenuDocumentDto>
{
    public async Task<MenuDocumentDto> Handle(GetMenuQuery request, CancellationToken ct)
    {
        var cached = await cache.GetAsync(ct);
        if (cached is not null) return cached;

        var document = await reader.ReadAsync(ct);
        await cache.SetAsync(document, ct);
        return document;
    }
}

/// <summary>Loads the menu from the database. Implemented in Infrastructure.</summary>
public interface IMenuReader
{
    Task<MenuDocumentDto> ReadAsync(CancellationToken ct);
}
