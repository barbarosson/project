using System;
using System.Globalization;

namespace UplinkFtp.Models.Dto;

/// <summary>Unix mode bits (owner/group/other rwx), typically 0–0777.</summary>
public readonly struct UnixFilePermissions
{
    public UnixFilePermissions(int mode) => Mode = mode & 0x1FF;

    public int Mode { get; }

    public bool OwnerRead => (Mode & 0b100_000_000) != 0;
    public bool OwnerWrite => (Mode & 0b010_000_000) != 0;
    public bool OwnerExecute => (Mode & 0b001_000_000) != 0;
    public bool GroupRead => (Mode & 0b000_100_000) != 0;
    public bool GroupWrite => (Mode & 0b000_010_000) != 0;
    public bool GroupExecute => (Mode & 0b000_001_000) != 0;
    public bool OtherRead => (Mode & 0b000_000_100) != 0;
    public bool OtherWrite => (Mode & 0b000_000_010) != 0;
    public bool OtherExecute => (Mode & 0b000_000_001) != 0;

    public string ToOctalString() => Convert.ToString(Mode, 8).PadLeft(3, '0');

    public static UnixFilePermissions FromFlags(
        bool ownerRead, bool ownerWrite, bool ownerExecute,
        bool groupRead, bool groupWrite, bool groupExecute,
        bool otherRead, bool otherWrite, bool otherExecute)
    {
        var mode = 0;
        if (ownerRead) mode |= 0b100_000_000;
        if (ownerWrite) mode |= 0b010_000_000;
        if (ownerExecute) mode |= 0b001_000_000;
        if (groupRead) mode |= 0b000_100_000;
        if (groupWrite) mode |= 0b000_010_000;
        if (groupExecute) mode |= 0b000_001_000;
        if (otherRead) mode |= 0b000_000_100;
        if (otherWrite) mode |= 0b000_000_010;
        if (otherExecute) mode |= 0b000_000_001;
        return new UnixFilePermissions(mode);
    }

    public static UnixFilePermissions FromOctalString(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException("Octal mode is required (e.g. 755).", nameof(text));
        }

        var trimmed = text.Trim();
        if (trimmed.StartsWith("0o", StringComparison.OrdinalIgnoreCase))
        {
            trimmed = trimmed[2..];
        }

        var mode = 0;
        foreach (var ch in trimmed)
        {
            if (ch is < '0' or > '7')
            {
                throw new FormatException($"Invalid octal mode '{text}'.");
            }

            mode = (mode << 3) | (ch - '0');
        }

        return new UnixFilePermissions(mode);
    }

    public override string ToString() => ToOctalString();
}
