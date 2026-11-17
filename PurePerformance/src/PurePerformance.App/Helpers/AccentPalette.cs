using Windows.UI;

namespace PurePerformance.Helpers;

/// <summary>Accent RGB values for free theme packs (applied on the window root).</summary>
public static class AccentPalette
{
    public static (Color Base, Color Light1, Color Light2, Color Dark1, Color Dark2) Resolve(
        Models.AccentPack pack) =>
        pack switch
        {
            Models.AccentPack.Ocean => (
                ColorFrom(0x00, 0x78, 0xD4),
                ColorFrom(0x4C, 0xA0, 0xE8),
                ColorFrom(0x8C, 0xC4, 0xF0),
                ColorFrom(0x00, 0x5A, 0x9E),
                ColorFrom(0x00, 0x3D, 0x6B)),
            Models.AccentPack.Forest => (
                ColorFrom(0x10, 0x7C, 0x10),
                ColorFrom(0x49, 0xA8, 0x49),
                ColorFrom(0x7C, 0xC4, 0x7C),
                ColorFrom(0x0B, 0x5A, 0x0B),
                ColorFrom(0x07, 0x3D, 0x07)),
            Models.AccentPack.Sunset => (
                ColorFrom(0xD8, 0x3B, 0x01),
                ColorFrom(0xE8, 0x6A, 0x3A),
                ColorFrom(0xF0, 0x98, 0x72),
                ColorFrom(0xA8, 0x2E, 0x01),
                ColorFrom(0x6B, 0x1E, 0x00)),
            Models.AccentPack.Slate => (
                ColorFrom(0x5B, 0x6B, 0x7C),
                ColorFrom(0x7E, 0x8C, 0x9A),
                ColorFrom(0xA3, 0xAD, 0xB8),
                ColorFrom(0x3F, 0x4C, 0x59),
                ColorFrom(0x2A, 0x33, 0x3C)),
            Models.AccentPack.Berry => (
                ColorFrom(0x8E, 0x2D, 0x6B),
                ColorFrom(0xB0, 0x5A, 0x92),
                ColorFrom(0xC9, 0x88, 0xB3),
                ColorFrom(0x6A, 0x21, 0x50),
                ColorFrom(0x45, 0x15, 0x35)),
            _ => (
                ColorFrom(0x00, 0x78, 0xD4),
                ColorFrom(0x4C, 0xA0, 0xE8),
                ColorFrom(0x8C, 0xC4, 0xF0),
                ColorFrom(0x00, 0x5A, 0x9E),
                ColorFrom(0x00, 0x3D, 0x6B))
        };

    public static string DisplayName(Models.AccentPack pack) => pack switch
    {
        Models.AccentPack.System => "Windows accent",
        Models.AccentPack.Ocean => "Ocean",
        Models.AccentPack.Forest => "Forest",
        Models.AccentPack.Sunset => "Sunset",
        Models.AccentPack.Slate => "Slate",
        Models.AccentPack.Berry => "Berry",
        _ => pack.ToString()
    };

    private static Color ColorFrom(byte r, byte g, byte b) =>
        Color.FromArgb(255, r, g, b);
}
