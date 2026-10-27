using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Security;

/// <summary>JSON pin store under LocalAppData (not Credential Locker — fingerprints are public).</summary>
public sealed class JsonSshHostKeyStore : ISshHostKeyStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public JsonSshHostKeyStore(string filePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        _filePath = filePath;
    }

    public async Task<string?> GetPinnedFingerprintAsync(
        string host,
        int port,
        CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(host, port);
        var doc = await ReadAsync(cancellationToken).ConfigureAwait(false);
        return doc.Entries.FirstOrDefault(e =>
            string.Equals(e.Key, key, StringComparison.OrdinalIgnoreCase))?.FingerprintSha256;
    }

    public async Task PinAsync(
        string host,
        int port,
        string sha256FingerprintHex,
        string? keyType = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(sha256FingerprintHex);
        var key = NormalizeKey(host, port);
        var fp = NormalizeFingerprint(sha256FingerprintHex);

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var doc = await ReadUnlockedAsync(cancellationToken).ConfigureAwait(false);
            doc.Entries.RemoveAll(e => string.Equals(e.Key, key, StringComparison.OrdinalIgnoreCase));
            doc.Entries.Add(new HostKeyEntry
            {
                Key = key,
                Host = host.Trim(),
                Port = port,
                FingerprintSha256 = fp,
                KeyType = keyType,
                PinnedAtUtc = DateTime.UtcNow
            });
            await WriteUnlockedAsync(doc, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RemoveAsync(string host, int port, CancellationToken cancellationToken = default)
    {
        var key = NormalizeKey(host, port);
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var doc = await ReadUnlockedAsync(cancellationToken).ConfigureAwait(false);
            doc.Entries.RemoveAll(e => string.Equals(e.Key, key, StringComparison.OrdinalIgnoreCase));
            await WriteUnlockedAsync(doc, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    public static string NormalizeKey(string host, int port)
        => $"{host.Trim().ToLowerInvariant()}:{port}";

    public static string NormalizeFingerprint(string hexOrColon)
    {
        var cleaned = hexOrColon.Trim()
            .Replace(":", string.Empty, StringComparison.Ordinal)
            .Replace(" ", string.Empty, StringComparison.Ordinal)
            .ToLowerInvariant();
        if (cleaned.StartsWith("sha256:", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned["sha256:".Length..];
        }

        return cleaned;
    }

    public static bool FingerprintsMatch(string a, string b)
        => string.Equals(NormalizeFingerprint(a), NormalizeFingerprint(b), StringComparison.OrdinalIgnoreCase);

    private async Task<HostKeyDocument> ReadAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            return await ReadUnlockedAsync(cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<HostKeyDocument> ReadUnlockedAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_filePath))
        {
            return new HostKeyDocument();
        }

        try
        {
            await using var stream = File.OpenRead(_filePath);
            var doc = await JsonSerializer.DeserializeAsync<HostKeyDocument>(stream, JsonOptions, cancellationToken)
                .ConfigureAwait(false);
            return doc ?? new HostKeyDocument();
        }
        catch (JsonException)
        {
            return new HostKeyDocument();
        }
    }

    private async Task WriteUnlockedAsync(HostKeyDocument doc, CancellationToken cancellationToken)
    {
        var dir = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        await using var stream = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(stream, doc, JsonOptions, cancellationToken).ConfigureAwait(false);
    }

    private sealed class HostKeyDocument
    {
        public List<HostKeyEntry> Entries { get; set; } = [];
    }

    private sealed class HostKeyEntry
    {
        public string Key { get; set; } = string.Empty;
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string FingerprintSha256 { get; set; } = string.Empty;
        public string? KeyType { get; set; }
        public DateTime PinnedAtUtc { get; set; }
    }
}
