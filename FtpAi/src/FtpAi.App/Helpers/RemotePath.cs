using System;
using System.IO;
using System.Linq;

namespace FtpAi.Helpers;

/// <summary>POSIX-style remote path helpers (servers expect '/' separators).</summary>
public static class RemotePath
{
    public static string Normalize(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) || path == "." || path == "./")
        {
            return "/";
        }

        var normalized = path.Replace('\\', '/');
        if (!normalized.StartsWith('/'))
        {
            normalized = "/" + normalized;
        }

        while (normalized.Contains("//", StringComparison.Ordinal))
        {
            normalized = normalized.Replace("//", "/", StringComparison.Ordinal);
        }

        if (normalized.Length > 1 && normalized.EndsWith('/'))
        {
            normalized = normalized.TrimEnd('/');
        }

        return normalized;
    }

    public static string Combine(string left, string right)
    {
        var a = Normalize(left);
        var b = (right ?? string.Empty).Replace('\\', '/').Trim('/');
        if (string.IsNullOrEmpty(b))
        {
            return a;
        }

        return a == "/" ? "/" + b : a + "/" + b;
    }

    public static string GetFileName(string path)
    {
        var normalized = Normalize(path);
        if (normalized == "/")
        {
            return "/";
        }

        return normalized.Split('/', StringSplitOptions.RemoveEmptyEntries).LastOrDefault() ?? normalized;
    }

    public static string GetDirectoryName(string path)
    {
        var normalized = Normalize(path);
        if (normalized == "/")
        {
            return "/";
        }

        var idx = normalized.LastIndexOf('/');
        return idx <= 0 ? "/" : normalized[..idx];
    }

    public static string ToLocal(string remoteRelativeSegments)
        => remoteRelativeSegments.Replace('/', Path.DirectorySeparatorChar);
}
