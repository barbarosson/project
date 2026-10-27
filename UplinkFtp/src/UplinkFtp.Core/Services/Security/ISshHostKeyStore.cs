using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Security;

/// <summary>Persists trusted SFTP/SSH host key fingerprints (SHA-256 hex).</summary>
public interface ISshHostKeyStore
{
    Task<string?> GetPinnedFingerprintAsync(
        string host,
        int port,
        CancellationToken cancellationToken = default);

    Task PinAsync(
        string host,
        int port,
        string sha256FingerprintHex,
        string? keyType = null,
        CancellationToken cancellationToken = default);

    Task RemoveAsync(string host, int port, CancellationToken cancellationToken = default);
}
