using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Persistence;

/// <summary>Pinned remote paths per site (Cyberduck-style bookmarks).</summary>
public sealed class SitePathBookmark
{
    public int SiteId { get; set; }

    public string Path { get; set; } = "/";

    public string Label { get; set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public interface ISiteBookmarkStore
{
    Task<IReadOnlyList<SitePathBookmark>> GetForSiteAsync(int siteId, CancellationToken cancellationToken = default);

    Task<SitePathBookmark> AddAsync(SitePathBookmark bookmark, CancellationToken cancellationToken = default);

    Task RemoveAsync(int siteId, string path, CancellationToken cancellationToken = default);
}

public sealed class JsonSiteBookmarkStore : ISiteBookmarkStore
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly string _filePath;
    private readonly SemaphoreSlim _gate = new(1, 1);

    public JsonSiteBookmarkStore(string filePath)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        _filePath = filePath;
    }

    public async Task<IReadOnlyList<SitePathBookmark>> GetForSiteAsync(
        int siteId,
        CancellationToken cancellationToken = default)
    {
        var doc = await ReadAsync(cancellationToken).ConfigureAwait(false);
        return doc.Bookmarks
            .Where(b => b.SiteId == siteId)
            .OrderBy(b => b.Label)
            .ThenBy(b => b.Path)
            .ToList();
    }

    public async Task<SitePathBookmark> AddAsync(
        SitePathBookmark bookmark,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(bookmark);
        if (string.IsNullOrWhiteSpace(bookmark.Path))
        {
            bookmark.Path = "/";
        }

        if (string.IsNullOrWhiteSpace(bookmark.Label))
        {
            bookmark.Label = bookmark.Path;
        }

        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var doc = await ReadUnlockedAsync(cancellationToken).ConfigureAwait(false);
            doc.Bookmarks.RemoveAll(b =>
                b.SiteId == bookmark.SiteId &&
                string.Equals(b.Path, bookmark.Path, StringComparison.OrdinalIgnoreCase));
            doc.Bookmarks.Add(bookmark);
            await WriteUnlockedAsync(doc, cancellationToken).ConfigureAwait(false);
            return bookmark;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async Task RemoveAsync(int siteId, string path, CancellationToken cancellationToken = default)
    {
        await _gate.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var doc = await ReadUnlockedAsync(cancellationToken).ConfigureAwait(false);
            doc.Bookmarks.RemoveAll(b =>
                b.SiteId == siteId &&
                string.Equals(b.Path, path, StringComparison.OrdinalIgnoreCase));
            await WriteUnlockedAsync(doc, cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            _gate.Release();
        }
    }

    private async Task<BookmarkDocument> ReadAsync(CancellationToken cancellationToken)
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

    private async Task<BookmarkDocument> ReadUnlockedAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_filePath))
        {
            return new BookmarkDocument();
        }

        try
        {
            await using var stream = File.OpenRead(_filePath);
            return await JsonSerializer.DeserializeAsync<BookmarkDocument>(stream, JsonOptions, cancellationToken)
                       .ConfigureAwait(false)
                   ?? new BookmarkDocument();
        }
        catch (JsonException)
        {
            return new BookmarkDocument();
        }
    }

    private async Task WriteUnlockedAsync(BookmarkDocument doc, CancellationToken cancellationToken)
    {
        var dir = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrEmpty(dir))
        {
            Directory.CreateDirectory(dir);
        }

        await using var stream = File.Create(_filePath);
        await JsonSerializer.SerializeAsync(stream, doc, JsonOptions, cancellationToken).ConfigureAwait(false);
    }

    private sealed class BookmarkDocument
    {
        public List<SitePathBookmark> Bookmarks { get; set; } = [];
    }
}
