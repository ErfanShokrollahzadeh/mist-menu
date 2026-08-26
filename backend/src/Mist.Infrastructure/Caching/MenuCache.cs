using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Mist.Application.Abstractions;
using Mist.Application.Contracts;

namespace Mist.Infrastructure.Caching;

/// <summary>
/// Caches the whole bilingual menu under one key. Backed by Redis when
/// ConnectionStrings:Redis is configured and by an in-memory distributed cache
/// otherwise, so `dotnet run` works with no Redis instance at all.
/// </summary>
public sealed class MenuCache(IDistributedCache cache) : IMenuCache
{
    private const string Key = "mist:menu:doc:v1";
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    private static readonly DistributedCacheEntryOptions Options = new()
    {
        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
    };

    public async Task<MenuDocumentDto?> GetAsync(CancellationToken ct)
    {
        var payload = await cache.GetStringAsync(Key, ct);
        return payload is null ? null : JsonSerializer.Deserialize<MenuDocumentDto>(payload, Json);
    }

    public Task SetAsync(MenuDocumentDto document, CancellationToken ct) =>
        cache.SetStringAsync(Key, JsonSerializer.Serialize(document, Json), Options, ct);

    /// <summary>Called on any menu mutation so an admin edit is visible at once
    /// rather than after the TTL lapses.</summary>
    public Task InvalidateAsync(CancellationToken ct) => cache.RemoveAsync(Key, ct);
}
