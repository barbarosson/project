using System.Text;

namespace WinAirPlay.Core.Discovery;

public static class DnsLabel
{
    /// <summary>
    /// Decodes DNS presentation-format escapes. Bonjour publishes "HomePod mini" on the wire as
    /// <c>HomePod\032mini</c>, so friendly names need unescaping before they are shown.
    /// </summary>
    public static string Unescape(string? label)
    {
        if (string.IsNullOrEmpty(label) || label.IndexOf('\\') < 0)
        {
            return label ?? string.Empty;
        }

        var builder = new StringBuilder(label.Length);

        for (var i = 0; i < label.Length; i++)
        {
            if (label[i] != '\\')
            {
                builder.Append(label[i]);
                continue;
            }

            if (i + 3 < label.Length &&
                char.IsAsciiDigit(label[i + 1]) &&
                char.IsAsciiDigit(label[i + 2]) &&
                char.IsAsciiDigit(label[i + 3]))
            {
                var code = ((label[i + 1] - '0') * 100) + ((label[i + 2] - '0') * 10) + (label[i + 3] - '0');
                builder.Append((char)code);
                i += 3;
            }
            else if (i + 1 < label.Length)
            {
                builder.Append(label[i + 1]);
                i++;
            }
        }

        return builder.ToString();
    }
}
