namespace UplinkFtp.Models.Dto;

/// <summary>Recursive directory size aggregate.</summary>
public sealed class DirectorySizeResult
{
    public required string Path { get; init; }

    public long TotalBytes { get; init; }

    public int FileCount { get; init; }

    public int DirectoryCount { get; init; }
}
