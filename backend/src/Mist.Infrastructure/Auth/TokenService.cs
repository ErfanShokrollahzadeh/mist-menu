using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Mist.Application.Auth;
using Mist.Domain.Entities;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Auth;

public sealed class JwtOptions
{
    public const string Section = "Jwt";
    public string Issuer { get; set; } = "mist-api";
    public string Audience { get; set; } = "mist-admin";
    /// <summary>Required. No default — a signing key baked into source is a
    /// forgeable token for anyone who reads the repository.</summary>
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 30;
    public int RefreshTokenDays { get; set; } = 14;
}

public sealed class TokenService(
    MistDbContext db,
    IOptions<JwtOptions> options) : ITokenService
{
    private readonly JwtOptions _opt = options.Value;

    public async Task<AuthTokens?> RefreshAsync(string refreshToken, CancellationToken ct)
    {
        var hash = HashToken(refreshToken);
        var stored = await db.RefreshTokens
            .Include(t => t.StaffUser)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (stored?.StaffUser is null || !stored.IsActive || !stored.StaffUser.IsActive) return null;

        var issued = await IssueAsync(stored.StaffUserId, ct);

        // Rotate: the presented token dies here, and we record its successor so a
        // replay of the old token is identifiable as theft rather than a retry.
        stored.RevokedAt = DateTimeOffset.UtcNow;
        var successor = await db.RefreshTokens
            .Where(t => t.StaffUserId == stored.StaffUserId)
            .OrderByDescending(t => t.CreatedAt)
            .FirstAsync(ct);
        stored.ReplacedByTokenId = successor.Id;
        await db.SaveChangesAsync(ct);

        return issued;
    }

    public async Task<AuthTokens> IssueAsync(Guid staffUserId, CancellationToken ct)
    {
        var user = await db.StaffUsers.FirstAsync(u => u.Id == staffUserId, ct);
        var now = DateTimeOffset.UtcNow;

        var accessExpires = now.AddMinutes(_opt.AccessTokenMinutes);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_opt.SigningKey)),
            SecurityAlgorithms.HmacSha256);

        var jwt = new JwtSecurityToken(
            issuer: _opt.Issuer,
            audience: _opt.Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Name, user.DisplayName),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.CreateVersion7().ToString()),
            ],
            notBefore: now.UtcDateTime,
            expires: accessExpires.UtcDateTime,
            signingCredentials: credentials);

        // 256 bits of entropy; only its hash is persisted.
        var refresh = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        var refreshExpires = now.AddDays(_opt.RefreshTokenDays);

        db.RefreshTokens.Add(new RefreshToken
        {
            StaffUserId = user.Id,
            TokenHash = HashToken(refresh),
            ExpiresAt = refreshExpires,
        });

        user.LastLoginAt = now;
        await db.SaveChangesAsync(ct);

        return new AuthTokens(
            new JwtSecurityTokenHandler().WriteToken(jwt), accessExpires,
            refresh, refreshExpires,
            user.DisplayName, user.Role.ToString());
    }

    public async Task RevokeAsync(string refreshToken, CancellationToken ct)
    {
        var hash = HashToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (stored is null || stored.RevokedAt is not null) return;
        stored.RevokedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    private static string HashToken(string token) =>
        Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}

public sealed class StaffDirectory(MistDbContext db, IPasswordHasher hasher) : IStaffDirectory
{
    public async Task<Guid?> AuthenticateAsync(LoginInput input, CancellationToken ct)
    {
        var email = input.Email.Trim().ToLowerInvariant();
        var user = await db.StaffUsers.FirstOrDefaultAsync(u => u.Email == email, ct);

        // Hash even when the user is missing, so response time does not reveal
        // which addresses are registered.
        var ok = hasher.Verify(input.Password, user?.PasswordHash ?? DummyHash);

        return user is not null && user.IsActive && ok ? user.Id : null;
    }

    /// <summary>A real hash of a throwaway value, so the miss path costs the
    /// same as the hit path.</summary>
    private const string DummyHash =
        "210000.AAAAAAAAAAAAAAAAAAAAAA==.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
}
