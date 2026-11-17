using PurePerformance.Models;

namespace PurePerformance.Services;

public interface IAiAssistService
{
    bool HasApiKey { get; }

    string BaseUrl { get; set; }

    string Model { get; set; }

    void SaveApiKey(string? apiKey);

    void ClearApiKey();

    /// <summary>
    /// Asks the configured OpenAI-compatible endpoint for extra fix ideas for one crash.
    /// Returns an honest error message when the key/URL is missing or the call fails.
    /// </summary>
    Task<AiAssistResult> SuggestFixAsync(CrashEvent finding, CancellationToken cancellationToken = default);
}

public sealed class AiAssistResult
{
    public bool Success { get; init; }

    public string Message { get; init; } = string.Empty;
}
