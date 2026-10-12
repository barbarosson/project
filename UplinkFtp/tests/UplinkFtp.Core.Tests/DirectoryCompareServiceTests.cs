using UplinkFtp.Services.Browse;

namespace UplinkFtp.Core.Tests;

public sealed class DirectoryCompareServiceTests
{
    private readonly DirectoryCompareService _sut = new();

    [Fact]
    public void Compare_detects_local_only_remote_only_and_size_diff()
    {
        var local = new[]
        {
            new FileListFingerprint { Name = "a.txt", IsDirectory = false, Size = 10, ModifiedUtc = DateTime.UtcNow },
            new FileListFingerprint { Name = "only-local", IsDirectory = false, Size = 1, ModifiedUtc = DateTime.UtcNow },
            new FileListFingerprint { Name = "folder", IsDirectory = true, Size = 0, ModifiedUtc = DateTime.UtcNow },
        };
        var remote = new[]
        {
            new FileListFingerprint { Name = "a.txt", IsDirectory = false, Size = 99, ModifiedUtc = DateTime.UtcNow },
            new FileListFingerprint { Name = "only-remote", IsDirectory = false, Size = 2, ModifiedUtc = DateTime.UtcNow },
            new FileListFingerprint { Name = "folder", IsDirectory = true, Size = 0, ModifiedUtc = DateTime.UtcNow },
        };

        var rows = _sut.Compare(local, remote);
        var byName = rows.ToDictionary(r => r.Name, StringComparer.OrdinalIgnoreCase);

        Assert.Equal(DirectoryCompareStatus.SizeDiffers, byName["a.txt"].Status);
        Assert.Equal(DirectoryCompareStatus.LocalOnly, byName["only-local"].Status);
        Assert.Equal(DirectoryCompareStatus.RemoteOnly, byName["only-remote"].Status);
        Assert.Equal(DirectoryCompareStatus.Same, byName["folder"].Status);
    }

    [Fact]
    public void Compare_detects_date_diff_beyond_two_seconds()
    {
        var t0 = new DateTime(2024, 1, 1, 12, 0, 0, DateTimeKind.Utc);
        var local = new[]
        {
            new FileListFingerprint { Name = "b.bin", IsDirectory = false, Size = 5, ModifiedUtc = t0 },
        };
        var remote = new[]
        {
            new FileListFingerprint { Name = "b.bin", IsDirectory = false, Size = 5, ModifiedUtc = t0.AddSeconds(5) },
        };

        var row = Assert.Single(_sut.Compare(local, remote));
        Assert.Equal(DirectoryCompareStatus.DateDiffers, row.Status);
    }
}
