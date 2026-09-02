using System.Globalization;

namespace WinAirPlay.Core.Rtsp;

/// <summary>
/// Parses the textual part of an RTSP response. Kept separate from the socket code so the fiddly
/// bits (folded headers, missing reason phrases, duplicate keys) can be unit tested.
/// </summary>
public static class RtspMessageParser
{
    public static (int StatusCode, string ReasonPhrase, IReadOnlyDictionary<string, string> Headers)
        ParseHead(string head)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(head);

        var lines = head.Replace("\r\n", "\n").TrimEnd('\n').Split('\n');
        var (statusCode, reasonPhrase) = ParseStatusLine(lines[0]);

        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        string? currentKey = null;

        for (var i = 1; i < lines.Length; i++)
        {
            var line = lines[i];
            if (line.Length == 0)
            {
                continue;
            }

            // A leading space or tab continues the previous header value.
            if ((line[0] == ' ' || line[0] == '\t') && currentKey is not null)
            {
                headers[currentKey] = $"{headers[currentKey]} {line.Trim()}";
                continue;
            }

            var separator = line.IndexOf(':');
            if (separator <= 0)
            {
                continue;
            }

            currentKey = line[..separator].Trim();
            headers[currentKey] = line[(separator + 1)..].Trim();
        }

        return (statusCode, reasonPhrase, headers);
    }

    public static (int StatusCode, string ReasonPhrase) ParseStatusLine(string statusLine)
    {
        var parts = statusLine.Trim().Split(' ', 3);

        if (parts.Length < 2 ||
            !parts[0].StartsWith("RTSP/", StringComparison.OrdinalIgnoreCase) ||
            !int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var statusCode))
        {
            throw new RtspException($"Invalid RTSP status line: '{statusLine}'");
        }

        return (statusCode, parts.Length == 3 ? parts[2].Trim() : string.Empty);
    }

    /// <summary>
    /// Splits a semicolon-delimited parameter list such as an RTSP <c>Transport</c> header.
    /// Flags without a value map to an empty string.
    /// </summary>
    public static IReadOnlyDictionary<string, string> ParseParameters(string? value)
    {
        var parameters = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        if (string.IsNullOrWhiteSpace(value))
        {
            return parameters;
        }

        foreach (var part in value.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            var separator = part.IndexOf('=');

            if (separator < 0)
            {
                parameters[part] = string.Empty;
                continue;
            }

            parameters[part[..separator].Trim()] = part[(separator + 1)..].Trim();
        }

        return parameters;
    }
}
