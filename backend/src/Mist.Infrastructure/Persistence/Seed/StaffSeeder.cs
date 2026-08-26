using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Mist.Application.Auth;
using Mist.Domain.Entities;
using Mist.Domain.Enums;
using Mist.Infrastructure.Persistence;

namespace Mist.Infrastructure.Persistence.Seed;

/// <summary>
/// Creates the first admin from configuration.
///
/// Deliberately has no fallback credentials. A seeded admin/admin is the same
/// mistake as the hardcoded connection string GitGuardian caught in pass 1,
/// with worse consequences: it would be a working login on a public host.
/// </summary>
public sealed class StaffSeeder(
    MistDbContext db,
    IPasswordHasher hasher,
    IConfiguration config,
    ILogger<StaffSeeder> logger)
{
    public async Task SeedAsync(CancellationToken ct = default)
    {
        if (await db.StaffUsers.AnyAsync(ct))
        {
            logger.LogInformation("Staff already present; skipping.");
            return;
        }

        var email = config["Seed:AdminEmail"];
        var password = config["Seed:AdminPassword"];
        var name = config["Seed:AdminName"] ?? "Yönetici";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            logger.LogWarning(
                "No staff account seeded: set Seed__AdminEmail and Seed__AdminPassword to create the first admin.");
            return;
        }

        if (password.Length < 12)
            throw new InvalidOperationException("Seed:AdminPassword must be at least 12 characters.");

        db.StaffUsers.Add(new StaffUser
        {
            Email = email.Trim().ToLowerInvariant(),
            DisplayName = name,
            PasswordHash = hasher.Hash(password),
            Role = StaffRole.Admin,
        });

        await db.SaveChangesAsync(ct);
        logger.LogInformation("Seeded admin {Email}.", email);
    }
}
