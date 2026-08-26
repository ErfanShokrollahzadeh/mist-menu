namespace Mist.Application.Auth;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string encoded);
}

public sealed record LoginInput(string Email, string Password);

public sealed record AuthTokens(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    string DisplayName,
    string Role);

public sealed record RefreshInput(string RefreshToken);

public interface ITokenService
{
    /// <summary>Issues an access JWT plus a fresh refresh token, persisting only
    /// the refresh token's hash.</summary>
    Task<AuthTokens> IssueAsync(Guid staffUserId, CancellationToken ct);

    /// <summary>Rotates a refresh token. Returns null when the presented token is
    /// unknown, expired or already revoked.</summary>
    Task<AuthTokens?> RefreshAsync(string refreshToken, CancellationToken ct);

    Task RevokeAsync(string refreshToken, CancellationToken ct);
}

public interface IStaffDirectory
{
    /// <summary>Verifies credentials. Returns null for unknown email, wrong
    /// password or a deactivated account — the caller must not distinguish them.</summary>
    Task<Guid?> AuthenticateAsync(LoginInput input, CancellationToken ct);
}
