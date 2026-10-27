using System;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Security;

/// <summary>
/// Evaluates an offered SSH host key against the pin store and optional UI prompt.
/// Used by <see cref="Sftp.SftpProtocolClient"/> before trusting the connection.
/// </summary>
public sealed class SshHostKeyVerifier
{
    private readonly ISshHostKeyStore _store;
    private readonly ISshHostKeyPrompt? _prompt;

    public SshHostKeyVerifier(ISshHostKeyStore store, ISshHostKeyPrompt? prompt = null)
    {
        _store = store;
        _prompt = prompt;
    }

    public async Task<bool> EvaluateAsync(
        string host,
        int port,
        byte[] hostKey,
        string? keyType,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(host);
        ArgumentNullException.ThrowIfNull(hostKey);

        var fingerprint = ToSha256Hex(hostKey);
        var pinned = await _store.GetPinnedFingerprintAsync(host, port, cancellationToken).ConfigureAwait(false);

        if (pinned is not null && JsonSshHostKeyStore.FingerprintsMatch(pinned, fingerprint))
        {
            return true;
        }

        if (pinned is not null)
        {
            // Key changed — require explicit pin/accept.
            if (_prompt is null)
            {
                return false;
            }

            var mismatch = await _prompt.PromptAsync(
                new SshHostKeyPromptRequest
                {
                    Host = host,
                    Port = port,
                    FingerprintSha256 = fingerprint,
                    KeyType = keyType,
                    PreviousFingerprintSha256 = pinned,
                    Kind = SshHostKeyPromptKind.Mismatch
                },
                cancellationToken).ConfigureAwait(false);

            return await ApplyDecisionAsync(host, port, fingerprint, keyType, mismatch.Decision, cancellationToken)
                .ConfigureAwait(false);
        }

        // First connect.
        if (_prompt is null)
        {
            // Headless / tests: auto-pin so Core can connect without UI.
            await _store.PinAsync(host, port, fingerprint, keyType, cancellationToken).ConfigureAwait(false);
            return true;
        }

        var first = await _prompt.PromptAsync(
            new SshHostKeyPromptRequest
            {
                Host = host,
                Port = port,
                FingerprintSha256 = fingerprint,
                KeyType = keyType,
                Kind = SshHostKeyPromptKind.FirstConnect
            },
            cancellationToken).ConfigureAwait(false);

        return await ApplyDecisionAsync(host, port, fingerprint, keyType, first.Decision, cancellationToken)
            .ConfigureAwait(false);
    }

    private async Task<bool> ApplyDecisionAsync(
        string host,
        int port,
        string fingerprint,
        string? keyType,
        SshHostKeyDecision decision,
        CancellationToken cancellationToken)
    {
        switch (decision)
        {
            case SshHostKeyDecision.PinAndTrust:
                await _store.PinAsync(host, port, fingerprint, keyType, cancellationToken).ConfigureAwait(false);
                return true;
            case SshHostKeyDecision.AcceptOnce:
                return true;
            default:
                return false;
        }
    }

    public static string ToSha256Hex(byte[] hostKey)
    {
        var hash = SHA256.HashData(hostKey);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string FormatFingerprintDisplay(string sha256Hex)
    {
        var n = JsonSshHostKeyStore.NormalizeFingerprint(sha256Hex);
        if (n.Length < 8)
        {
            return n;
        }

        // Group as aa:bb:cc… for readability (first 16 bytes shown fully).
        var chars = n.ToCharArray();
        var sb = new System.Text.StringBuilder(n.Length + n.Length / 2);
        for (var i = 0; i < chars.Length; i++)
        {
            if (i > 0 && i % 2 == 0)
            {
                sb.Append(':');
            }

            sb.Append(chars[i]);
        }

        return sb.ToString();
    }
}
