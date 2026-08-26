using System.Security.Cryptography;
using Mist.Application.Auth;

namespace Mist.Infrastructure.Auth;

/// <summary>
/// PBKDF2-SHA256 with a per-user salt. Deliberately not ASP.NET Identity:
/// this project needs one hash function, not a membership framework.
///
/// Format: {iterations}.{base64 salt}.{base64 hash} — the iteration count is
/// stored with the hash so it can be raised later without invalidating
/// existing passwords.
/// </summary>
public sealed class PasswordHasher : IPasswordHasher
{
    private const int Iterations = 210_000;   // OWASP guidance for PBKDF2-SHA256
    private const int SaltBytes = 16;
    private const int HashBytes = 32;

    public string Hash(string password)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(password);

        var salt = RandomNumberGenerator.GetBytes(SaltBytes);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, HashAlgorithmName.SHA256, HashBytes);
        return $"{Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string encoded)
    {
        if (string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(encoded)) return false;

        var parts = encoded.Split('.', 3);
        if (parts.Length != 3 || !int.TryParse(parts[0], out var iterations)) return false;

        byte[] salt, expected;
        try
        {
            salt = Convert.FromBase64String(parts[1]);
            expected = Convert.FromBase64String(parts[2]);
        }
        catch (FormatException) { return false; }

        var actual = Rfc2898DeriveBytes.Pbkdf2(
            password, salt, iterations, HashAlgorithmName.SHA256, expected.Length);

        // Fixed-time comparison: a length-or-content shortcut leaks the hash by timing.
        return CryptographicOperations.FixedTimeEquals(actual, expected);
    }
}
