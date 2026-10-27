using System;

namespace UplinkFtp.Services.Licensing;

/// <summary>User-facing Store purchase status / error strings (testable without WinRT).</summary>
public static class StorePurchaseMessages
{
    /// <summary>
    /// Formats a purchase failure for the License dialog: type + real message, plus recovery hint.
    /// </summary>
    public static string FormatUnavailable(Exception ex)
    {
        ArgumentNullException.ThrowIfNull(ex);

        var typeName = ex.GetType().Name;
        var message = (ex.Message ?? string.Empty).Trim();
        var detail = string.IsNullOrEmpty(message)
            ? typeName
            : $"{typeName}: {message}";

        // Keep dialog text readable if WinRT dumps a very long HResult blob.
        const int maxDetail = 240;
        if (detail.Length > maxDetail)
        {
            detail = detail[..(maxDetail - 1)] + "…";
        }

        return $"Store purchase unavailable ({detail}). Associate the app with the Store and sign in with a sandbox/test account.";
    }
}
