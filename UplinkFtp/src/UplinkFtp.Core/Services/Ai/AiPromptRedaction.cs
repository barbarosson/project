using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;

namespace UplinkFtp.Services.Ai;

/// <summary>Strips secrets before any cloud prompt is built.</summary>
public static class AiPromptRedaction
{
    private static readonly Regex PasswordLike = new(
        @"(password|passwd|pwd|secret|api[_-]?key|authorization|bearer)\s*[:=]\s*\S+",
        RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public static IReadOnlyList<string> RedactLogLines(IEnumerable<string>? lines)
        => (lines ?? [])
            .Select(RedactLine)
            .TakeLast(40)
            .ToArray();

    public static string RedactLine(string? line)
    {
        if (string.IsNullOrEmpty(line))
        {
            return string.Empty;
        }

        var scrubbed = PasswordLike.Replace(line, "$1=[REDACTED]");
        if (scrubbed.Contains("private key", StringComparison.OrdinalIgnoreCase))
        {
            scrubbed = Regex.Replace(scrubbed, @"(\S+\.(pem|ppk|key))", "[REDACTED_KEY_PATH]", RegexOptions.IgnoreCase);
        }

        return scrubbed;
    }
}
