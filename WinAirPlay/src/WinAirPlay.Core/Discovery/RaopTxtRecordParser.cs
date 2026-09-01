using System.Globalization;

namespace WinAirPlay.Core.Discovery;

/// <summary>
/// Turns the flat TXT key/value pairs of a <c>_raop._tcp</c> announcement into
/// <see cref="RaopCapabilities"/>. Unknown or malformed keys fall back to AirPlay defaults instead
/// of throwing, because receivers vary a lot between firmware versions.
/// </summary>
public static class RaopTxtRecordParser
{
    public static RaopCapabilities Parse(IReadOnlyDictionary<string, string>? txt)
    {
        if (txt is null || txt.Count == 0)
        {
            return RaopCapabilities.Unknown;
        }

        return new RaopCapabilities(
            SampleRate: ReadInt(txt, "sr") ?? 44100,
            SampleSize: ReadInt(txt, "ss") ?? 16,
            Channels: ReadInt(txt, "ch") ?? 2,
            Codecs: ReadEnumList<RaopCodec>(txt, "cn"),
            EncryptionTypes: ReadEnumList<RaopEncryption>(txt, "et"),
            RequiresPassword: ReadBool(txt, "pw") ?? false,
            TransportProtocol: ReadString(txt, "tp"),
            ProtocolVersion: ReadInt(txt, "vn"),
            ServerVersion: ReadString(txt, "vs"),
            Model: ReadString(txt, "am"),
            Features: ReadFeatures(txt, "ft"),
            PublicKey: ReadString(txt, "pk"));
    }

    public static string? ReadString(IReadOnlyDictionary<string, string> txt, string key) =>
        txt.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value) ? value.Trim() : null;

    public static int? ReadInt(IReadOnlyDictionary<string, string> txt, string key) =>
        int.TryParse(ReadString(txt, key), NumberStyles.Integer, CultureInfo.InvariantCulture, out var value)
            ? value
            : null;

    public static bool? ReadBool(IReadOnlyDictionary<string, string> txt, string key)
    {
        var raw = ReadString(txt, key);
        return raw?.ToLowerInvariant() switch
        {
            "true" or "1" or "yes" => true,
            "false" or "0" or "no" => false,
            _ => null,
        };
    }

    /// <summary>
    /// The <c>ft</c> key carries a 64-bit feature mask split into two hex words, low first
    /// (for example <c>0x4A7FCA00,0xBC354BD0</c>).
    /// </summary>
    public static ulong? ReadFeatures(IReadOnlyDictionary<string, string> txt, string key)
    {
        var raw = ReadString(txt, key);
        if (raw is null)
        {
            return null;
        }

        var parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        if (parts.Length == 0 || !TryParseHex(parts[0], out var low))
        {
            return null;
        }

        if (parts.Length == 1)
        {
            return low;
        }

        return TryParseHex(parts[1], out var high) ? (high << 32) | low : low;
    }

    private static IReadOnlyList<TEnum> ReadEnumList<TEnum>(IReadOnlyDictionary<string, string> txt, string key)
        where TEnum : struct, Enum
    {
        var raw = ReadString(txt, key);
        if (raw is null)
        {
            return Array.Empty<TEnum>();
        }

        var values = new List<TEnum>();
        foreach (var part in raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            if (!int.TryParse(part, NumberStyles.Integer, CultureInfo.InvariantCulture, out var number))
            {
                continue;
            }

            var value = (TEnum)Enum.ToObject(typeof(TEnum), number);
            if (!values.Contains(value))
            {
                values.Add(value);
            }
        }

        return values;
    }

    private static bool TryParseHex(string text, out ulong value)
    {
        var trimmed = text.StartsWith("0x", StringComparison.OrdinalIgnoreCase) ? text[2..] : text;
        return ulong.TryParse(trimmed, NumberStyles.HexNumber, CultureInfo.InvariantCulture, out value);
    }
}
