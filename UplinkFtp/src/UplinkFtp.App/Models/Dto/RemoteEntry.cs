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
}
