using UplinkFtp.Helpers;

namespace UplinkFtp.Core.Tests;

public sealed class RemotePathTests
{
    [Theory]
    [InlineData(null, "/")]
    [InlineData("", "/")]
    [InlineData(".", "/")]
    [InlineData("./", "/")]
    [InlineData("foo", "/foo")]
    [InlineData("/foo/", "/foo")]
    [InlineData("\\foo\\bar", "/foo/bar")]
    [InlineData("//foo///bar//", "/foo/bar")]
    public void Normalize_handles_common_cases(string? input, string expected)
        => Assert.Equal(expected, RemotePath.Normalize(input));

    [Fact]
    public void Combine_joins_segments()
    {
        Assert.Equal("/a/b", RemotePath.Combine("/a", "b"));
        Assert.Equal("/b", RemotePath.Combine("/", "b"));
        Assert.Equal("/a", RemotePath.Combine("/a", ""));
    }

    [Fact]
    public void GetFileName_and_GetDirectoryName()
    {
        Assert.Equal("file.txt", RemotePath.GetFileName("/dir/file.txt"));
        Assert.Equal("/dir", RemotePath.GetDirectoryName("/dir/file.txt"));
        Assert.Equal("/", RemotePath.GetFileName("/"));
        Assert.Equal("/", RemotePath.GetDirectoryName("/"));
    }
}
