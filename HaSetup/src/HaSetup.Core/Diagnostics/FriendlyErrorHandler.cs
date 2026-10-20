namespace HaSetup.Core.Diagnostics;

/// <summary>
/// Turns exceptions and Docker/WSL stderr into short English messages for the UI.
/// Raw technical detail is never the primary user-facing text.
/// </summary>
public static class FriendlyErrorHandler
{
    public const int MaxDetailChars = 240;

    public static string ToUserMessage(Exception exception, string? context = null)
    {
        ArgumentNullException.ThrowIfNull(exception);

        if (exception is OperationCanceledException)
        {
            return Prefix(context, "The operation was cancelled.");
        }

        var fromPattern = ErrorPatternCatalog.Match(exception.Message)
            ?? ErrorPatternCatalog.Match(exception.ToString());
        if (fromPattern is not null)
        {
            return Prefix(context, fromPattern);
        }

        // Prefer a trimmed single-line message over stack / multi-line stderr dumps.
        var compact = Compact(exception.Message);
        if (string.IsNullOrWhiteSpace(compact))
        {
            return Prefix(context, "Something went wrong. Press Refresh, or check that Docker Desktop is running.");
        }

        return Prefix(context, $"Something went wrong: {compact}");
    }

    public static string ToUserMessage(string? rawOutput, string? context = null)
    {
        var fromPattern = ErrorPatternCatalog.Match(rawOutput);
        if (fromPattern is not null)
        {
            return Prefix(context, fromPattern);
        }

        var compact = Compact(rawOutput);
        if (string.IsNullOrWhiteSpace(compact))
        {
            return Prefix(context, "The operation failed. Ensure Docker Desktop is running, then try again.");
        }

        return Prefix(context, $"The operation failed: {compact}");
    }

    /// <summary>
    /// Optional secondary line for logs only (never the MessageBox primary text).
    /// </summary>
    public static string? FormatDetailForLog(string? raw)
    {
        var compact = Compact(raw);
        return string.IsNullOrWhiteSpace(compact) ? null : compact;
    }

    private static string Prefix(string? context, string message) =>
        string.IsNullOrWhiteSpace(context) ? message : $"{context.Trim()} {message}";

    private static string Compact(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        var singleLine = text
            .Replace("\r\n", " ", StringComparison.Ordinal)
            .Replace('\n', ' ')
            .Replace('\r', ' ')
            .Trim();

        while (singleLine.Contains("  ", StringComparison.Ordinal))
        {
            singleLine = singleLine.Replace("  ", " ", StringComparison.Ordinal);
        }

        if (singleLine.Length <= MaxDetailChars)
        {
            return singleLine;
        }

        return singleLine[..(MaxDetailChars - 1)] + "…";
    }
}
