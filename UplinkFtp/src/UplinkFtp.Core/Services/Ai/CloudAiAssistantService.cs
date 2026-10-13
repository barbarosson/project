using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Services.Ai;

/// <summary>
/// BYOK cloud LLM adapter. Supports OpenAI Chat Completions–compatible endpoints and Google Gemini.
/// No embedded keys. Non-troubleshoot capabilities throw <see cref="NotSupportedException"/> —
/// call via <see cref="LocalAiAssistantService"/> which falls back locally.
/// </summary>
public sealed class CloudAiAssistantService : IAiAssistantService
{
    public const string DefaultOpenAiEndpoint = "https://api.openai.com/v1/chat/completions";
    public const string DefaultOpenAiModel = "gpt-4o-mini";
    public const string DefaultGeminiModel = "gemini-2.0-flash";
    public const string DefaultGeminiEndpointBase = "https://generativelanguage.googleapis.com/v1beta";

    private readonly ICredentialStore _credentials;
    private readonly AppSettings _settings;
    private readonly HttpClient _http;

    public CloudAiAssistantService(ICredentialStore credentials, AppSettings settings, HttpClient? httpClient = null)
    {
        _credentials = credentials;
        _settings = settings;
        _http = httpClient ?? new HttpClient { Timeout = TimeSpan.FromSeconds(60) };
    }

    public AiProviderKind ConfiguredProvider => _settings.AiProvider;

    public async Task<bool> HasApiKeyAsync(CancellationToken cancellationToken = default)
    {
        var key = await _credentials.GetSecretAsync(
            AiCredentialKeys.ApiKeyResource,
            AiCredentialKeys.ApiKeyUserName,
            cancellationToken).ConfigureAwait(false);
        return !string.IsNullOrWhiteSpace(key);
    }

    public bool IsCapabilityAvailable(AiCapability capability)
        => capability == AiCapability.Troubleshoot && _settings.AiProvider != AiProviderKind.None;

    public async Task<AiTroubleshootResult> TroubleshootAsync(
        AiTroubleshootRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (_settings.AiProvider == AiProviderKind.None)
        {
            throw new InvalidOperationException("Select an AI provider in Settings (Gemini, OpenAI, or Anthropic).");
        }

        var apiKey = await _credentials.GetSecretAsync(
            AiCredentialKeys.ApiKeyResource,
            AiCredentialKeys.ApiKeyUserName,
            cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("No API key stored. Settings → AI → paste your BYOK key (Gemini, OpenAI, or Anthropic).");
        }

        var redacted = AiPromptRedaction.RedactLogLines(request.LogLines);
        var userPrompt =
            "You are a senior FTP/SFTP support engineer. Given redacted logs, reply with JSON: " +
            "{\"title\":\"...\",\"advice\":\"...\",\"steps\":[\"...\"],\"suggestedUiAction\":\"...\"}. " +
            "Be concrete and actionable. Never ask for passwords.\n" +
            $"Protocol: {request.Protocol ?? "unknown"}\n" +
            $"Host: {request.Host ?? "unknown"}\n" +
            $"LastCommand: {request.LastCommandHint ?? "n/a"}\n" +
            "Logs:\n" + string.Join('\n', redacted);

        using var req = _settings.AiProvider == AiProviderKind.Gemini
            ? BuildGeminiRequest(apiKey, userPrompt)
            : BuildOpenAiCompatibleRequest(apiKey, userPrompt);

        using var resp = await _http.SendAsync(req, cancellationToken).ConfigureAwait(false);
        var raw = await resp.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!resp.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(FormatHttpError(_settings.AiProvider, (int)resp.StatusCode, raw));
        }

        var content = _settings.AiProvider == AiProviderKind.Gemini
            ? ExtractGeminiText(raw)
            : ExtractOpenAiText(raw);

        content = StripFence(content);
        using var parsed = JsonDocument.Parse(content);
        var root = parsed.RootElement;
        var steps = new List<string>();
        if (root.TryGetProperty("steps", out var stepsEl) && stepsEl.ValueKind == JsonValueKind.Array)
        {
            foreach (var s in stepsEl.EnumerateArray())
            {
                if (s.GetString() is { Length: > 0 } step)
                {
                    steps.Add(step);
                }
            }
        }

        return new AiTroubleshootResult
        {
            Title = root.TryGetProperty("title", out var t) ? t.GetString() ?? "AI diagnosis" : "AI diagnosis",
            Advice = root.TryGetProperty("advice", out var a) ? a.GetString() ?? content : content,
            Steps = steps,
            SuggestedUiAction = root.TryGetProperty("suggestedUiAction", out var u) ? u.GetString() : null,
            UsedCloudModel = true
        };
    }

    /// <summary>Builds the Gemini generateContent URL (without API key query) for tests/docs.</summary>
    public static string ResolveGeminiUrl(string? model, string? endpointOverride)
    {
        if (!string.IsNullOrWhiteSpace(endpointOverride))
        {
            return endpointOverride.Trim();
        }

        var m = string.IsNullOrWhiteSpace(model) ? DefaultGeminiModel : model.Trim();
        return $"{DefaultGeminiEndpointBase}/models/{m}:generateContent";
    }

    /// <summary>Default model id for a provider when Settings model is empty.</summary>
    public static string DefaultModelFor(AiProviderKind provider) => provider switch
    {
        AiProviderKind.Gemini => DefaultGeminiModel,
        AiProviderKind.Anthropic => "claude-3-5-haiku-latest",
        _ => DefaultOpenAiModel
    };

    private HttpRequestMessage BuildGeminiRequest(string apiKey, string userPrompt)
    {
        var url = ResolveGeminiUrl(_settings.AiModel, _settings.AiEndpoint);
        // Prefer header so endpoint overrides need not embed secrets.
        var req = new HttpRequestMessage(HttpMethod.Post, url);
        req.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);
        var body = new
        {
            contents = new object[]
            {
                new
                {
                    role = "user",
                    parts = new object[]
                    {
                        new
                        {
                            text = "Return only valid JSON for FTP/SFTP troubleshooting.\n\n" + userPrompt
                        }
                    }
                }
            },
            generationConfig = new { temperature = 0.2 }
        };
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return req;
    }

    private HttpRequestMessage BuildOpenAiCompatibleRequest(string apiKey, string userPrompt)
    {
        var model = string.IsNullOrWhiteSpace(_settings.AiModel)
            ? DefaultModelFor(_settings.AiProvider)
            : _settings.AiModel.Trim();
        var endpoint = string.IsNullOrWhiteSpace(_settings.AiEndpoint)
            ? DefaultOpenAiEndpoint
            : _settings.AiEndpoint.Trim();

        var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        var body = new
        {
            model,
            temperature = 0.2,
            messages = new object[]
            {
                new { role = "system", content = "Return only valid JSON for FTP/SFTP troubleshooting." },
                new { role = "user", content = userPrompt }
            }
        };
        req.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        return req;
    }

    private static string ExtractOpenAiText(string raw)
    {
        using var doc = JsonDocument.Parse(raw);
        return doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";
    }

    private static string ExtractGeminiText(string raw)
    {
        using var doc = JsonDocument.Parse(raw);
        var root = doc.RootElement;
        if (!root.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Gemini returned no candidates. Check model name and API key.");
        }

        var parts = candidates[0].GetProperty("content").GetProperty("parts");
        var sb = new StringBuilder();
        foreach (var part in parts.EnumerateArray())
        {
            if (part.TryGetProperty("text", out var text))
            {
                sb.Append(text.GetString());
            }
        }

        var result = sb.ToString();
        if (string.IsNullOrWhiteSpace(result))
        {
            throw new InvalidOperationException("Gemini response had empty text.");
        }

        return result;
    }

    private static string FormatHttpError(AiProviderKind provider, int status, string raw)
    {
        var hint = provider switch
        {
            AiProviderKind.Gemini when status is 400 or 403 or 404
                => " Check Gemini API key, model (e.g. gemini-2.0-flash), and that Generative Language API is enabled.",
            AiProviderKind.OpenAi when status is 401 or 403
                => " Check OpenAI API key and endpoint.",
            AiProviderKind.Anthropic when status is 401 or 403
                => " Anthropic native Messages API needs a compatible gateway URL in Endpoint override, or use Gemini/OpenAI.",
            _ => " Check BYOK key, model, and endpoint in Settings → AI."
        };

        var snippet = raw.Length > 180 ? raw[..180] + "…" : raw;
        return $"AI provider HTTP {status}.{hint} {(string.IsNullOrWhiteSpace(snippet) ? "" : "Detail: " + snippet)}".Trim();
    }

    public Task<AiFileFilter> ParseSearchQueryAsync(string naturalLanguageQuery, CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Cloud NL search not wired — LocalAiAssistantService handles fallback.");

    public Task<AiRenamePreview> PreviewBatchRenameAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Cloud batch rename not wired — use local preview.");

    public Task<AiMovePreview> PreviewSmartMoveAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Cloud smart move not wired — use local preview.");

    public Task<AiSshCommandProposal> ProposeSshCommandAsync(
        string naturalLanguageRequest,
        string currentRemotePath,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Cloud SSH assist not wired — use local proposal.");

    public Task<AiQuickEditProposal> ProposeQuickEditAsync(
        AiQuickEditRequest request,
        CancellationToken cancellationToken = default)
        => throw new NotSupportedException("Cloud Quick Edit not wired — use local proposal.");

    private static string StripFence(string content)
    {
        var trimmed = content.Trim();
        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNl = trimmed.IndexOf('\n');
            if (firstNl > 0)
            {
                trimmed = trimmed[(firstNl + 1)..];
            }

            if (trimmed.EndsWith("```", StringComparison.Ordinal))
            {
                trimmed = trimmed[..^3];
            }
        }

        return trimmed.Trim();
    }
}
