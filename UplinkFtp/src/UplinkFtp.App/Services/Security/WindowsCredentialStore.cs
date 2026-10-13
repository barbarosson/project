using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Data;
using Windows.Security.Credentials;

namespace UplinkFtp.Services.Security;

/// <summary>
/// Primary: Windows Credential Locker (<see cref="PasswordVault"/>).
/// Fallback: DPAPI-protected file under %LocalAppData%/UplinkFtp/credentials/
/// (covers unpackaged edge cases where the vault is unavailable).
/// </summary>
public sealed class WindowsCredentialStore : ICredentialStore
{
    private const string ResourcePrefix = "UplinkFtp.Site.";

    /// <summary>Pre-rename vault resource prefix (read/delete fallback only).</summary>
    private const string LegacyResourcePrefix = "FtpAi.Site.";

    public Task SaveSecretAsync(
        string resourceKey,
        string userName,
        string secret,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceKey);
        ArgumentNullException.ThrowIfNull(userName);
        ArgumentNullException.ThrowIfNull(secret);

        var resource = ToResource(resourceKey);
        // Best-effort vault write; DPAPI always persisted as durable fallback.
        _ = TrySaveVault(resource, userName, secret);
        // Drop legacy vault entry if present so secrets converge on the new identity.
        TryDeleteVault(LegacyResourcePrefix + resourceKey, userName);
        SaveDpapi(resourceKey, secret);
        return Task.CompletedTask;
    }

    public Task<string?> GetSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceKey);

        var resource = ToResource(resourceKey);
        if (TryGetVault(resource, userName, out var fromVault) && !string.IsNullOrEmpty(fromVault))
        {
            return Task.FromResult<string?>(fromVault);
        }

        // Legacy PasswordVault identity from the FTP AI rename era.
        if (TryGetVault(LegacyResourcePrefix + resourceKey, userName, out fromVault) &&
            !string.IsNullOrEmpty(fromVault))
        {
            return Task.FromResult<string?>(fromVault);
        }

        var fromDpapi = TryGetDpapi(resourceKey) ?? TryGetLegacyDpapi(resourceKey);
        return Task.FromResult(fromDpapi);
    }

    public Task DeleteSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentException.ThrowIfNullOrWhiteSpace(resourceKey);

        var resource = ToResource(resourceKey);
        TryDeleteVault(resource, userName);
        TryDeleteVault(LegacyResourcePrefix + resourceKey, userName);
        TryDeleteDpapi(resourceKey);
        TryDeleteLegacyDpapi(resourceKey);
        return Task.CompletedTask;
    }

    private static string ToResource(string resourceKey) => ResourcePrefix + resourceKey;

    private static bool TrySaveVault(string resource, string userName, string secret)
    {
        try
        {
            var vault = new PasswordVault();
            try
            {
                var existing = vault.Retrieve(resource, userName);
                vault.Remove(existing);
            }
            catch (Exception)
            {
                // No existing credential — fine.
            }

            vault.Add(new PasswordCredential(resource, userName, secret));
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private static bool TryGetVault(string resource, string userName, out string? secret)
    {
        secret = null;
        try
        {
            var vault = new PasswordVault();
            var credential = vault.Retrieve(resource, userName);
            credential.RetrievePassword();
            secret = credential.Password;
            return true;
        }
        catch (Exception)
        {
            return false;
        }
    }

    private static void TryDeleteVault(string resource, string userName)
    {
        try
        {
            var vault = new PasswordVault();
            var credential = vault.Retrieve(resource, userName);
            vault.Remove(credential);
        }
        catch (Exception)
        {
            // Already gone or vault unavailable.
        }
    }

    private static void SaveDpapi(string resourceKey, string secret)
    {
        var bytes = Encoding.UTF8.GetBytes(secret);
        var protectedBytes = ProtectedData.Protect(bytes, optionalEntropy: GetEntropy(resourceKey), DataProtectionScope.CurrentUser);
        File.WriteAllBytes(GetDpapiPath(resourceKey), protectedBytes);
    }

    private static string? TryGetDpapi(string resourceKey)
    {
        var path = GetDpapiPath(resourceKey);
        if (!File.Exists(path))
        {
            return null;
        }

        try
        {
            var protectedBytes = File.ReadAllBytes(path);
            var bytes = ProtectedData.Unprotect(protectedBytes, optionalEntropy: GetEntropy(resourceKey), DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(bytes);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    private static void TryDeleteDpapi(string resourceKey)
    {
        var path = GetDpapiPath(resourceKey);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    private static string? TryGetLegacyDpapi(string resourceKey)
    {
        var path = GetLegacyDpapiPath(resourceKey);
        if (!File.Exists(path))
        {
            return null;
        }

        try
        {
            var protectedBytes = File.ReadAllBytes(path);
            var bytes = ProtectedData.Unprotect(
                protectedBytes,
                optionalEntropy: GetLegacyEntropy(resourceKey),
                DataProtectionScope.CurrentUser);
            return Encoding.UTF8.GetString(bytes);
        }
        catch (CryptographicException)
        {
            return null;
        }
    }

    private static void TryDeleteLegacyDpapi(string resourceKey)
    {
        var path = GetLegacyDpapiPath(resourceKey);
        if (File.Exists(path))
        {
            File.Delete(path);
        }
    }

    private static string GetDpapiPath(string resourceKey)
        => Path.Combine(AppDatabasePaths.GetCredentialStoreDirectory(), SanitizeFileName(resourceKey) + ".dpapi");

    private static string GetLegacyDpapiPath(string resourceKey)
        => Path.Combine(AppDatabasePaths.GetLegacyCredentialStoreDirectory(), SanitizeFileName(resourceKey) + ".dpapi");

    private static string SanitizeFileName(string resourceKey)
    {
        foreach (var c in Path.GetInvalidFileNameChars())
        {
            resourceKey = resourceKey.Replace(c, '_');
        }

        return resourceKey;
    }

    private static byte[] GetEntropy(string resourceKey)
        => SHA256.HashData(Encoding.UTF8.GetBytes("UplinkFtp|" + resourceKey));

    private static byte[] GetLegacyEntropy(string resourceKey)
        => SHA256.HashData(Encoding.UTF8.GetBytes("FtpAi|" + resourceKey));
}
