using UplinkFtp.Models.Dto;

namespace UplinkFtp.Core.Tests;

public sealed class UnixFilePermissionsTests
{
    [Theory]
    [InlineData("755", 0b111_101_101)]
    [InlineData("644", 0b110_100_100)]
    [InlineData("0o700", 0b111_000_000)]
    public void FromOctalString_parses_common_modes(string text, int expected)
    {
        var perms = UnixFilePermissions.FromOctalString(text);
        Assert.Equal(expected, perms.Mode);
        Assert.Equal(Convert.ToString(expected, 8).PadLeft(3, '0'), perms.ToOctalString());
    }

    [Fact]
    public void FromFlags_builds_mode_bits()
    {
        var perms = UnixFilePermissions.FromFlags(
            ownerRead: true, ownerWrite: true, ownerExecute: true,
            groupRead: true, groupWrite: false, groupExecute: true,
            otherRead: true, otherWrite: false, otherExecute: true);

        Assert.Equal(0b111_101_101, perms.Mode);
        Assert.True(perms.OwnerExecute);
        Assert.False(perms.GroupWrite);
    }

    [Fact]
    public void FromOctalString_rejects_invalid_digits()
    {
        Assert.Throws<FormatException>(() => UnixFilePermissions.FromOctalString("89a"));
    }
}
