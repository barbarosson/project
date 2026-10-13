using System.Collections.Generic;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Browse;

public enum DirectoryCompareStatus
{
    Same = 0,
    LocalOnly = 1,
    RemoteOnly = 2,
    SizeDiffers = 3,
    DateDiffers = 4
}

public sealed class DirectoryCompareRow
{
    public required string Name { get; init; }
    public DirectoryCompareStatus Status { get; init; }
}

public interface IDirectoryCompareService
{
    IReadOnlyList<DirectoryCompareRow> Compare(
        IEnumerable<FileListFingerprint> local,
        IEnumerable<FileListFingerprint> remote);
}

/// <summary>Minimal listing fingerprint for compare (local or remote).</summary>
public sealed class FileListFingerprint
{
    public required string Name { get; init; }
    public bool IsDirectory { get; init; }
    public long Size { get; init; }
    public System.DateTime? ModifiedUtc { get; init; }
}
