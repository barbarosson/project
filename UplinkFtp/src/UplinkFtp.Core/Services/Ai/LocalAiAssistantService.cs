using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Services.Assist;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Services.Ai;

/// <summary>
/// On-device heuristics + BYOK gate. Cloud LLM calls are delegated only when a key exists
/// and <see cref="CloudAiAssistantService"/> is composed (optional).
/// </summary>
public sealed class LocalAiAssistantService : IAiAssistantService
{
    private readonly ICredentialStore _credentials;
    private readonly AppSettings _settings;
    private readonly IAiAssistantService? _cloud;

    public LocalAiAssistantService(
        ICredentialStore credentials,
        AppSettings settings,
        IAiAssistantService? cloud = null)
    {
        _credentials = credentials;
        _settings = settings;
        _cloud = cloud;
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

    public bool IsCapabilityAvailable(AiCapability capability) => capability switch
    {
        AiCapability.Troubleshoot => true,
        AiCapability.NaturalLanguageSearch => true,
        AiCapability.BatchRename => true,
        AiCapability.SmartMove => true,
        AiCapability.SshCommand => true,
        AiCapability.QuickEdit => true,
        _ => false
    };

    public async Task<AiTroubleshootResult> TroubleshootAsync(
        AiTroubleshootRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        string? cloudError = null;
        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                var cloud = await _cloud.TroubleshootAsync(request, cancellationToken).ConfigureAwait(false);
                if (!string.IsNullOrWhiteSpace(cloud.Advice))
                {
                    return cloud;
                }
            }
            catch (Exception ex)
            {
                // Keep local heuristics, but surface the cloud failure clearly in the UI.
                cloudError = ex.Message;
            }
        }

        var redacted = AiPromptRedaction.RedactLogLines(request.LogLines);
        var diagnosis = ConnectionAssistService.Diagnose(redacted);
        var steps = BuildTroubleshootSteps(redacted, diagnosis, request.Protocol);
        var advice = string.IsNullOrWhiteSpace(cloudError)
            ? diagnosis.Advice
            : $"Cloud AI ({_settings.AiProvider}) failed: {cloudError}\n\nLocal fallback:\n{diagnosis.Advice}";

        return new AiTroubleshootResult
        {
            Title = string.IsNullOrWhiteSpace(cloudError) ? diagnosis.Title : "Cloud AI failed — local fallback",
            Advice = advice,
            Steps = steps,
            SuggestedUiAction = MapSuggestedAction(diagnosis),
            UsedCloudModel = false
        };
    }

    public async Task<AiFileFilter> ParseSearchQueryAsync(
        string naturalLanguageQuery,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var q = naturalLanguageQuery?.Trim() ?? string.Empty;
        if (q.Length == 0)
        {
            return new AiFileFilter
            {
                Explanation = "Enter a natural-language search (e.g. ZIP files larger than 50MB)."
            };
        }

        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                return await _cloud.ParseSearchQueryAsync(q, cancellationToken).ConfigureAwait(false);
            }
            catch
            {
                // Fall through to local heuristics.
            }
        }

        // Local keyword heuristics.
        string? ext = null;
        if (Regex.IsMatch(q, @"\bzip\b", RegexOptions.IgnoreCase))
        {
            ext = ".zip";
        }
        else if (Regex.IsMatch(q, @"\b(png|jpe?g|gif|webp|images?)\b", RegexOptions.IgnoreCase))
        {
            ext = ".png";
        }

        string? contains = null;
        var quoted = Regex.Match(q, "[\"']([^\"']+)[\"']");
        if (quoted.Success)
        {
            contains = quoted.Groups[1].Value;
        }
        else
        {
            var backup = Regex.Match(q, @"\bcontaining\s+(\S+)", RegexOptions.IgnoreCase);
            if (backup.Success)
            {
                contains = backup.Groups[1].Value.Trim('\'', '"');
            }
            else if (q.Contains("backup", StringComparison.OrdinalIgnoreCase))
            {
                contains = "backup";
            }
        }

        long? minBytes = null;
        var sizeMb = Regex.Match(q, @"(\d+)\s*mb", RegexOptions.IgnoreCase);
        if (sizeMb.Success && long.TryParse(sizeMb.Groups[1].Value, out var mb))
        {
            minBytes = mb * 1024L * 1024L;
        }

        DateTimeOffset? after = null;
        if (Regex.IsMatch(q, @"last\s+week|geçen\s+hafta", RegexOptions.IgnoreCase))
        {
            after = DateTimeOffset.UtcNow.AddDays(-7);
        }

        // Plain name search (no NL keywords): use the whole query as a substring match.
        // This makes the browser Filter box work without a cloud key.
        if (contains is null
            && ext is null
            && minBytes is null
            && after is null)
        {
            contains = q;
        }

        var explanation = contains is not null && ext is null && minBytes is null && after is null
            ? $"Name contains “{contains}”."
            : "Local filter parse (BYOK cloud parse not required).";

        return new AiFileFilter
        {
            RawQuery = q,
            Extension = ext,
            NameContains = contains,
            MinSizeBytes = minBytes,
            ModifiedAfterUtc = after,
            Explanation = explanation
        };
    }

    public async Task<AiRenamePreview> PreviewBatchRenameAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                return await _cloud.PreviewBatchRenameAsync(fileNames, naturalLanguageRule, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch
            {
                // Local fallback below.
            }
        }

        var rule = naturalLanguageRule?.Trim() ?? string.Empty;
        var items = new List<AiRenamePreviewItem>();

        foreach (var name in fileNames ?? [])
        {
            var next = name;
            if (Regex.IsMatch(rule, @"tarihi\s*sil|remove\s*date|strip\s*date", RegexOptions.IgnoreCase))
            {
                next = Regex.Replace(next, @"[-_]?\d{4}[-_]?\d{2}[-_]?\d{2}", string.Empty);
            }

            if (Regex.IsMatch(rule, @"-v2|sonuna.*v2|append.*v2", RegexOptions.IgnoreCase))
            {
                var ext = System.IO.Path.GetExtension(next);
                var stem = System.IO.Path.GetFileNameWithoutExtension(next);
                next = stem.TrimEnd('-', '_') + "-v2" + ext;
            }

            if (!string.Equals(name, next, StringComparison.Ordinal))
            {
                items.Add(new AiRenamePreviewItem { OldName = name, NewName = next });
            }
        }

        return new AiRenamePreview
        {
            Items = items,
            RuleSummary = string.IsNullOrWhiteSpace(rule)
                ? "No rule"
                : $"Preview for: {rule}"
        };
    }

    public async Task<AiMovePreview> PreviewSmartMoveAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                return await _cloud.PreviewSmartMoveAsync(fileNames, naturalLanguageRule, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch
            {
                // Local fallback.
            }
        }

        _ = naturalLanguageRule;
        var items = new List<AiMovePreviewItem>();
        foreach (var name in fileNames ?? [])
        {
            var ext = System.IO.Path.GetExtension(name).ToLowerInvariant();
            var dest = ext switch
            {
                ".png" or ".jpg" or ".jpeg" or ".gif" or ".webp" or ".bmp" => "Images/" + name,
                ".pdf" or ".doc" or ".docx" or ".txt" or ".md" or ".rtf" => "Docs/" + name,
                _ => string.Empty
            };
            if (dest.Length > 0)
            {
                items.Add(new AiMovePreviewItem { SourceName = name, DestinationRelativePath = dest });
            }
        }

        return new AiMovePreview
        {
            Items = items,
            RuleSummary = "Heuristic: images → Images/, documents → Docs/ (confirm before enqueue)."
        };
    }

    public async Task<AiSshCommandProposal> ProposeSshCommandAsync(
        string naturalLanguageRequest,
        string currentRemotePath,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                return await _cloud.ProposeSshCommandAsync(naturalLanguageRequest, currentRemotePath, cancellationToken)
                    .ConfigureAwait(false);
            }
            catch
            {
                // Local fallback.
            }
        }

        var req = naturalLanguageRequest?.Trim() ?? string.Empty;
        var cwd = string.IsNullOrWhiteSpace(currentRemotePath) ? "." : currentRemotePath.Trim();

        string command;
        string explanation;
        if (Regex.IsMatch(req, @"tar\.gz|sıkıştır|compress|archive", RegexOptions.IgnoreCase)
            && Regex.IsMatch(req, @"\.log|log", RegexOptions.IgnoreCase))
        {
            command = $"cd {QuoteShell(cwd)} && tar -czvf logs.tar.gz -- *.log";
            explanation = "Creates logs.tar.gz from *.log in the current remote folder. Review before running.";
        }
        else if (req.Length > 0)
        {
            command = $"cd {QuoteShell(cwd)} && ls -la";
            explanation = "Generic listing proposal — refine the request or configure BYOK for richer SSH assist.";
        }
        else
        {
            command = $"cd {QuoteShell(cwd)} && pwd";
            explanation = "Empty request — showing working directory check only.";
        }

        return new AiSshCommandProposal
        {
            Command = command,
            Explanation = explanation + " Auto-execute is disabled."
        };
    }

    public async Task<AiQuickEditProposal> ProposeQuickEditAsync(
        AiQuickEditRequest request,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(request);

        if (_settings.AiProvider != AiProviderKind.None
            && await HasApiKeyAsync(cancellationToken).ConfigureAwait(false)
            && _cloud is not null)
        {
            try
            {
                return await _cloud.ProposeQuickEditAsync(request, cancellationToken).ConfigureAwait(false);
            }
            catch
            {
                // Local fallback.
            }
        }

        var original = request.FileContent ?? string.Empty;
        var instruction = request.Instruction?.Trim() ?? string.Empty;
        var proposed = original;

        if (Regex.IsMatch(instruction, @"https|ssl|tls|yönlendir|redirect", RegexOptions.IgnoreCase)
            && request.RemotePath.Contains("htaccess", StringComparison.OrdinalIgnoreCase))
        {
            const string rule =
                "\n# Uplink AI Quick Edit — HTTP to HTTPS\n" +
                "RewriteEngine On\n" +
                "RewriteCond %{HTTPS} !=on\n" +
                "RewriteRule ^/?(.*) https://%{SERVER_NAME}/$1 [R=301,L]\n";
            if (!original.Contains("RewriteCond %{HTTPS}", StringComparison.Ordinal))
            {
                proposed = original.TrimEnd() + rule;
            }
        }

        return new AiQuickEditProposal
        {
            OriginalContent = original,
            ProposedContent = proposed,
            Summary = string.Equals(original, proposed, StringComparison.Ordinal)
                ? "No local heuristic change — configure BYOK for general NL edits. Upload only after you confirm."
                : "Proposed HTTPS redirect block for .htaccess. Confirm before upload."
        };
    }

    private static string QuoteShell(string path)
        => "'" + path.Replace("'", "'\\''", StringComparison.Ordinal) + "'";

    private static IReadOnlyList<string> BuildTroubleshootSteps(
        IReadOnlyList<string> logLines,
        ConnectionAssistDiagnosis diagnosis,
        string? protocol)
    {
        var steps = new List<string>
        {
            diagnosis.Advice
        };

        var joined = string.Join('\n', logLines);
        if (joined.Contains("550", StringComparison.Ordinal) ||
            joined.Contains("permission denied", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add("Server denied access to the path (550 / permission). Check remote folder ACLs or try CHMOD 755 on the directory (SFTP/SSH).");
        }

        if (joined.Contains("530", StringComparison.Ordinal) ||
            joined.Contains("login incorrect", StringComparison.OrdinalIgnoreCase))
        {
            steps.Add("Login rejected (530). Verify User/Password or Sites → private key for SFTP.");
        }

        if (!string.IsNullOrWhiteSpace(protocol))
        {
            steps.Add(string.Create(CultureInfo.InvariantCulture, $"Active protocol hint: {protocol}."));
        }

        if (diagnosis.SuggestedPort is int port)
        {
            steps.Add($"Try port {port}" +
                      (diagnosis.SuggestedProtocol is null ? "." : $" with {diagnosis.SuggestedProtocol}."));
        }

        return steps;
    }

    private static string? MapSuggestedAction(ConnectionAssistDiagnosis diagnosis)
    {
        if (diagnosis.Title.Contains("Authentication", StringComparison.OrdinalIgnoreCase))
        {
            return "Open Sites / check User + Password";
        }

        if (diagnosis.Title.Contains("refused", StringComparison.OrdinalIgnoreCase))
        {
            return "Verify OpenSSH/FTP server is running";
        }

        if (diagnosis.Title.Contains("TLS", StringComparison.OrdinalIgnoreCase) ||
            diagnosis.Title.Contains("certificate", StringComparison.OrdinalIgnoreCase))
        {
            return "Settings → Accept any FTPS certificate (lab only)";
        }

        return "Open Assist for URI parse + diagnosis";
    }
}
