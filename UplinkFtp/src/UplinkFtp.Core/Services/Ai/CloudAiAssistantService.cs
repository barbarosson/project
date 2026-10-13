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
/// BYOK cloud LLM adapter (OpenAI Chat Completions–compatible). No embedded keys.
/// Non-troubleshoot capabilities throw <see cref="NotSupportedException"/> until prompts are finalized —
/// call via <see cref="LocalAiAssistantService"/> which falls back locally.
/// </summary>
public sealed class CloudAiAssistantService : IAiAssistantService
{
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
            throw new InvalidOperationException("Select an AI provider in Settings (OpenAI or Anthropic).");
        }

        var apiKey = await _credentials.GetSecretAsync(
            AiCredentialKeys.ApiKeyResource,
            AiCredentialKeys.ApiKeyUserName,
            cancellationToken).ConfigureAwait(false);

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("No API key stored. Settings → AI → paste your BYOK key.");
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

        // Anthropic path uses the same OpenAI-compatible shape only when user points a gateway;
        // native Anthropic Messages API can be added later without changing IAiAssistantService.
        var model = string.IsNullOrWhiteSpace(_settings.AiModel) ? "gpt-4o-mini" : _settings.AiModel;
        var endpoint = string.IsNullOrWhiteSpace(_settings.AiEndpoint)
            ? "https://api.openai.com/v1/chat/completions"
            : _settings.AiEndpoint.Trim();

        using var req = new HttpRequestMessage(HttpMethod.Post, endpoint);
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

        using var resp = await _http.SendAsync(req, cancellationToken).ConfigureAwait(false);
        var raw = await resp.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);
        if (!resp.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI provider HTTP {(int)resp.StatusCode}. Check BYOK key and endpoint.");
        }

        using var doc = JsonDocument.Parse(raw);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString() ?? "{}";

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
