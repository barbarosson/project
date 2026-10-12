using System.Threading;
using System.Threading.Tasks;

namespace FtpAi.Services.Security;

/// <summary>
/// Secure secret storage. Passwords must never be persisted in SQLite plaintext.
/// </summary>
public interface ICredentialStore
{
    /// <summary>Upserts a secret for the given resource key + username pair.</summary>
    Task SaveSecretAsync(
        string resourceKey,
        string userName,
        string secret,
        CancellationToken cancellationToken = default);

    /// <summary>Returns the secret, or null if none is stored.</summary>
    Task<string?> GetSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes any stored secret for the resource key.</summary>
    Task DeleteSecretAsync(
        string resourceKey,
        string userName,
        CancellationToken cancellationToken = default);
}
