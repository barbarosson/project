using System;
using System.IO;

namespace UplinkFtp.Services.Ai;

/// <summary>Applies <see cref="AiFileFilter"/> to listing rows (local or remote).</summary>
public static class AiFileFilterMatcher
{
    public static bool Matches(
        string name,
        bool isDirectory,
        long size,
        DateTime? modifiedUtc,
        AiFileFilter filter)
    {
        ArgumentNullException.ThrowIfNull(filter);

        if (isDirectory)
        {
            // NL file search targets files; keep parent ".." and folders out of filter hits.
            return false;
        }

        if (!string.IsNullOrWhiteSpace(filter.Extension))
        {
            var ext = filter.Extension!.StartsWith('.')
                ? filter.Extension
                : "." + filter.Extension;
            if (!name.EndsWith(ext, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }
        }

        if (!string.IsNullOrWhiteSpace(filter.NameContains)
            && name.IndexOf(filter.NameContains!, StringComparison.OrdinalIgnoreCase) < 0)
        {
            return false;
        }

        if (filter.MinSizeBytes is long min && size < min)
        {
            return false;
        }

        if (filter.MaxSizeBytes is long max && size > max)
        {
            return false;
        }

        if (filter.ModifiedAfterUtc is DateTimeOffset after)
        {
            if (modifiedUtc is null || modifiedUtc.Value < after.UtcDateTime)
            {
                return false;
            }
        }

        if (filter.ModifiedBeforeUtc is DateTimeOffset before)
        {
            if (modifiedUtc is null || modifiedUtc.Value > before.UtcDateTime)
            {
                return false;
            }
        }

        var hasConstraint = !string.IsNullOrWhiteSpace(filter.Extension)
                            || !string.IsNullOrWhiteSpace(filter.NameContains)
                            || filter.MinSizeBytes is not null
                            || filter.MaxSizeBytes is not null
                            || filter.ModifiedAfterUtc is not null
                            || filter.ModifiedBeforeUtc is not null;
        // No parsed constraints → do not treat as a match (UI shows filter.Explanation).
        return hasConstraint;
    }

    public static bool IsLikelyTextConfig(string fileName)
    {
        var name = Path.GetFileName(fileName);
        if (string.IsNullOrWhiteSpace(name))
        {
            return false;
        }

        if (name.Equals(".htaccess", StringComparison.OrdinalIgnoreCase)
            || name.Equals("wp-config.php", StringComparison.OrdinalIgnoreCase)
            || name.Equals("nginx.conf", StringComparison.OrdinalIgnoreCase)
            || name.Equals("web.config", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var ext = Path.GetExtension(name);
        return ext is ".conf" or ".ini" or ".env" or ".json" or ".yml" or ".yaml" or ".txt" or ".php"
            or ".css" or ".js" or ".xml" or ".htaccess";
    }
}
