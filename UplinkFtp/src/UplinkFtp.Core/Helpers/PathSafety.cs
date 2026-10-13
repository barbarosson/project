using System;
using System.IO;
using System.Linq;

namespace UplinkFtp.Helpers;

/// <summary>Local path traversal guards for downloads and uploads.</summary>
public static class PathSafety
{
    /// <summary>
    /// Returns true when <paramref name="path"/> resolves under <paramref name="root"/>
    /// (or equals the root directory).
    /// </summary>
    public static bool IsPathUnderRoot(string path, string root)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);
        ArgumentException.ThrowIfNullOrWhiteSpace(root);

        var fullPath = Path.GetFullPath(path);
        var fullRoot = Path.GetFullPath(root);

        var rootNormalized = fullRoot.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (string.Equals(fullPath.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar),
                rootNormalized, StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        var rootPrefix = rootNormalized + Path.DirectorySeparatorChar;
        return fullPath.StartsWith(rootPrefix, StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Throws when the path contains traversal segments, null bytes, or (when
    /// <paramref name="root"/> is set) escapes the allowed root.
    /// </summary>
    public static void RejectTraversal(string path, string? root = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(path);

        if (path.Contains('\0', StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Path contains invalid characters.");
        }

        // Reject explicit parent-segment tokens before normalization hides them.
        var segments = path.Replace('\\', '/').Split('/', StringSplitOptions.RemoveEmptyEntries);
        if (segments.Any(s => s == ".."))
        {
            throw new InvalidOperationException("Path traversal rejected.");
        }

        if (root is not null && !IsPathUnderRoot(path, root))
        {
            throw new InvalidOperationException("Path is outside the allowed root.");
        }
    }
}
