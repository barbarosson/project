using System;

namespace UplinkFtp.Models.Dto;

/// <summary>Normalized remote file or directory entry for UI/list consumers.</summary>
public sealed class RemoteEntry
{
    public required string Name { get; init; }

    public required string FullPath { get; init; }

    public bool IsDirectory { get; init; }

    public long Size { get; init; }

    public DateTime? ModifiedUtc { get; init; }

    public bool IsSymlink { get; init; }

    /// <summary>Symlink target when the protocol exposes it.</summary>
    public string? LinkTarget { get; init; }

    /// <summary>Unix mode bits when available (e.g. 0o755).</summary>
    public int? UnixMode { get; init; }

    public bool IsHidden => Name.StartsWith(".", StringComparison.Ordinal);
}
