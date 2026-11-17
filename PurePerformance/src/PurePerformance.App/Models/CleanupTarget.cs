namespace PurePerformance.Models;

public sealed class CleanupTarget
{
    public required string Id { get; init; }

    public required string DisplayName { get; init; }

    /// <summary>Exact folders/files this action touches — shown in UI before cleaning.</summary>
    public required string WhatItCleans { get; init; }

    public required IReadOnlyList<string> Paths { get; init; }

    public bool RequiresAdmin { get; init; }

    public long EstimatedBytes { get; set; }

    public bool IsSelected { get; set; } = true;

    public string SizeLabel => FormatBytes(EstimatedBytes);

    public static string FormatBytes(long bytes)
    {
        if (bytes < 1024) return $"{bytes} B";
        double kb = bytes / 1024.0;
        if (kb < 1024) return $"{kb:0.#} KB";
        double mb = kb / 1024.0;
        if (mb < 1024) return $"{mb:0.#} MB";
        return $"{mb / 1024.0:0.##} GB";
    }
}

public sealed class CleanupResult
{
    public long BytesRemoved { get; init; }

    public int FilesRemoved { get; init; }

    public int FilesSkipped { get; init; }

    public IReadOnlyList<string> Notes { get; init; } = Array.Empty<string>();
}
