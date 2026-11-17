using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PurePerformance.Models;

namespace PurePerformance.Services;

/// <summary>
/// Optional Pro AI assist via a user-provided OpenAI-compatible HTTP endpoint.
/// No API keys are bundled with the app.
/// </summary>
public sealed class OpenAiCompatibleAssistService : IAiAssistService
{
    public const string CredentialKey = "AiApiKey";

    private static readonly HttpClient Http = new()
    {
        Timeout = TimeSpan.FromSeconds(60)
    };

    private readonly ISecureCredentialStore _secrets;
    private readonly UserSettingsStore _settings;

    public OpenAiCompatibleAssistService(ISecureCredentialStore secrets, UserSettingsStore settings)
    {
        _secrets = secrets;
        _settings = settings;
    }

    public bool HasApiKey => _secrets.HasSecret(CredentialKey);

    public string BaseUrl
    {
        get => _settings.AiBaseUrl;
        set => _settings.AiBaseUrl = value;
    }

    public string Model
    {
        get => _settings.AiModel;
        set => _settings.AiModel = value;
    }

    public void SaveApiKey(string? apiKey)
    {
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            ClearApiKey();
            return;
        }

        _secrets.SetSecret(CredentialKey, apiKey);
    }

    public void ClearApiKey() => _secrets.RemoveSecret(CredentialKey);

    public async Task<AiAssistResult> SuggestFixAsync(CrashEvent finding, CancellationToken cancellationToken = default)
    {
        if (!_secrets.TryGetSecret(CredentialKey, out var apiKey) || string.IsNullOrWhiteSpace(apiKey))
        {
            return new AiAssistResult
            {
                Success = false,
                Message = "No AI API key is saved. Open Settings → Pro AI assist, paste your key, and try again. The app never ships with a built-in key."
            };
        }

        var baseUrl = (BaseUrl ?? string.Empty).Trim().TrimEnd('/');
        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            return new AiAssistResult
            {
                Success = false,
                Message = "AI base URL is empty. Set an OpenAI-compatible endpoint (for example https://api.openai.com/v1) in Settings."
            };
        }

        var model = string.IsNullOrWhiteSpace(Model) ? "gpt-4o-mini" : Model.Trim();
        var endpoint = baseUrl.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase)
            ? baseUrl
            : baseUrl + "/chat/completions";

        var userPrompt =
            "You are helping a Windows user understand an Event Viewer finding from Pure Performance Crash Analyzer.\n" +
            "Give concise, practical fix steps. Do not invent fake cleanup scores. Do not suggest blind registry wipes.\n\n" +
            $"Title: {finding.Title}\n" +
            $"Category: {finding.CategoryLabel}\n" +
            $"Severity: {finding.Severity}\n" +
            $"Provider: {finding.ProviderName} (Event ID {finding.EventId})\n" +
            $"When: {finding.Timestamp:u}\n" +
            $"Built-in explanation: {finding.Explanation}\n" +
            $"Built-in fix: {finding.RecommendedFix}\n" +
            $"Raw excerpt: {finding.RawMessage}\n";

        var payload = new
        {
            model,
            temperature = 0.2,
            messages = new object[]
            {
                new { role = "system", content = "You suggest careful Windows troubleshooting steps." },
                new { role = "user", content = userPrompt }
            }
        };

        try
        {
            using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            req.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            using var resp = await Http.SendAsync(req, cancellationToken);
            var body = await resp.Content.ReadAsStringAsync(cancellationToken);

            if (!resp.IsSuccessStatusCode)
            {
                return new AiAssistResult
                {
                    Success = false,
                    Message = $"AI request failed ({(int)resp.StatusCode}). Check the base URL, model name, and API key. Details: {Truncate(body, 280)}"
                };
            }

            using var doc = JsonDocument.Parse(body);
            if (!doc.RootElement.TryGetProperty("choices", out var choices) ||
                choices.GetArrayLength() == 0)
            {
                return new AiAssistResult
                {
                    Success = false,
                    Message = "AI response did not include choices. The endpoint may not be OpenAI-compatible."
                };
            }

            var content = choices[0].GetProperty("message").GetProperty("content").GetString();
            if (string.IsNullOrWhiteSpace(content))
            {
                return new AiAssistResult
                {
                    Success = false,
                    Message = "AI returned an empty suggestion."
                };
            }

            return new AiAssistResult { Success = true, Message = content.Trim() };
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (Exception ex)
        {
            return new AiAssistResult
            {
                Success = false,
                Message = $"AI request error: {ex.Message}"
            };
        }
    }

    private static string Truncate(string text, int max) =>
        text.Length <= max ? text : text[..max] + "…";
}
