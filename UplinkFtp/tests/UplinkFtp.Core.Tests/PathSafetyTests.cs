using UplinkFtp.Helpers;

namespace UplinkFtp.Core.Tests;

public sealed class PathSafetyTests
{
    [Fact]
    public void IsPathUnderRoot_allows_child_and_root()
    {
        var root = Path.Combine(Path.GetTempPath(), "uplink-root-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            var child = Path.Combine(root, "sub", "file.txt");
            Directory.CreateDirectory(Path.GetDirectoryName(child)!);
            File.WriteAllText(child, "x");

            Assert.True(PathSafety.IsPathUnderRoot(root, root));
            Assert.True(PathSafety.IsPathUnderRoot(child, root));
            Assert.False(PathSafety.IsPathUnderRoot(Path.GetTempPath(), root));
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    [Fact]
    public void RejectTraversal_throws_on_parent_segments()
    {
        Assert.Throws<InvalidOperationException>(() => PathSafety.RejectTraversal("../etc/passwd"));
        Assert.Throws<InvalidOperationException>(() => PathSafety.RejectTraversal("foo/../../bar"));
    }

    [Fact]
    public void RejectTraversal_throws_when_outside_root()
    {
        var root = Path.Combine(Path.GetTempPath(), "uplink-safe-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        try
        {
            Assert.Throws<InvalidOperationException>(() =>
                PathSafety.RejectTraversal(Path.GetTempPath(), root));
            PathSafety.RejectTraversal(Path.Combine(root, "ok.txt"), root);
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }
}
