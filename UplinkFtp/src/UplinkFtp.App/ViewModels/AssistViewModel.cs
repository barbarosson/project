using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using UplinkFtp.Helpers;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Assist;
using UplinkFtp.Services.Ftp;

namespace UplinkFtp.ViewModels;

/// <summary>
/// AI Assist hub: URI parse, troubleshoot, NL search, batch rename/move, SSH propose, Quick Edit.
/// </summary>
public sealed partial class AssistViewModel : ObservableObject
{
    private readonly IAiAssistantService _ai;
    private readonly IFtpService _ftp;
    private LogViewModel? _log;
    private MainViewModel? _main;

    [ObservableProperty]
    private int _selectedTabIndex;

    [ObservableProperty]
    private string _connectionText = string.Empty;

    [ObservableProperty]
    private string _parseSummary = "Paste sftp://user@host:22/path or host:port, then Apply.";

    [ObservableProperty]
    private string _diagnosisTitle = "Diagnosis";

    [ObservableProperty]
    private string _diagnosisAdvice =
        "Assist uses IAiAssistantService — local heuristics without a key; cloud when BYOK is set.";

    [ObservableProperty]
    private string _diagnosisSteps = string.Empty;

    [ObservableProperty]
    private string _aiModeText = string.Empty;

    [ObservableProperty]
    private string _statusMessage = string.Empty;

    [ObservableProperty]
    private string _searchQuery =
        "ZIP files larger than 50MB containing backup from last week";

    [ObservableProperty]
    private string _searchResultText = "Parse a natural-language query, then Apply on Local or Remote.";

    [ObservableProperty]
    private string _searchTarget = "Remote";

    [ObservableProperty]
    private string _batchRule = "Strip date from names and append -v2";

    [ObservableProperty]
    private string _batchPreviewText = "Preview rename/move against the current remote listing.";

    [ObservableProperty]
    private string _sshRequest = "Compress all .log files into a tar.gz archive";

    [ObservableProperty]
    private string _sshProposedCommand = string.Empty;

    [ObservableProperty]
    private string _sshExplanation = "SFTP only. Commands never auto-run.";

    [ObservableProperty]
    private string _sshOutput = string.Empty;

    [ObservableProperty]
    private bool _isSshAvailable;

    [ObservableProperty]
    private string _quickEditPath = string.Empty;

    [ObservableProperty]
    private string _quickEditInstruction = "Redirect all HTTP traffic to HTTPS";

    [ObservableProperty]
    private string _quickEditOriginal = string.Empty;

    [ObservableProperty]
    private string _quickEditProposed = string.Empty;

    [ObservableProperty]
    private string _quickEditSummary = "Select a remote text config, load, propose, then confirm upload.";

    public ObservableCollection<string> SearchTargets { get; } = ["Remote", "Local"];

    public ObservableCollection<string> RenamePreviewLines { get; } = [];

    public ObservableCollection<string> MovePreviewLines { get; } = [];

    private AiRenamePreview? _renamePreview;
    private AiMovePreview? _movePreview;
    private AiSshCommandProposal? _sshProposal;

    /// <summary>Raised after Apply fills the quick-connect bar.</summary>
    public event EventHandler? AppliedToConnectBar;

    public AssistViewModel(IAiAssistantService ai, IFtpService ftp)
    {
        _ai = ai;
        _ftp = ftp;
    }

    public void Attach(MainViewModel main, LogViewModel log, int initialTabIndex = 0)
    {
        _main = main;
        _log = log;
        SelectedTabIndex = Math.Clamp(initialTabIndex, 0, 4);
        RefreshConnectionFlags();
        PrefillQuickEditFromSelection();
        _ = RefreshDiagnosisAsync();
    }

    public void FocusTroubleshoot()
    {
        SelectedTabIndex = 0;
        _ = RefreshDiagnosisAsync();
    }

    public void FocusQuickEdit(string? remotePath = null)
    {
        SelectedTabIndex = 4;
        if (!string.IsNullOrWhiteSpace(remotePath))
        {
            QuickEditPath = remotePath;
        }
        else
        {
            PrefillQuickEditFromSelection();
        }
    }

    private void RefreshConnectionFlags()
    {
        IsSshAvailable = _ftp.IsConnected
                         && string.Equals(_main?.SelectedProtocol, "SFTP", StringComparison.OrdinalIgnoreCase);
        if (!IsSshAvailable && string.IsNullOrWhiteSpace(SshExplanation))
        {
            SshExplanation = "Connect with SFTP to enable SSH command assist.";
        }
    }

    private void PrefillQuickEditFromSelection()
    {
        var selected = _main?.RemoteBrowser.SelectedItem;
        if (selected is { IsDirectory: false, IsParentLink: false }
            && AiFileFilterMatcher.IsLikelyTextConfig(selected.Name))
        {
            QuickEditPath = selected.FullPath;
        }
        else if (string.IsNullOrWhiteSpace(QuickEditPath) && _main is not null)
        {
            QuickEditPath = RemotePath.Combine(_main.RemoteBrowser.CurrentPath, ".htaccess");
        }
    }

    [RelayCommand]
    private void Parse()
    {
        var result = ConnectionAssistService.ParseConnectionText(ConnectionText);
        ParseSummary = result.Summary;
        StatusMessage = result.Success ? "Parsed — click Apply to fill Connect." : "Parse failed.";
    }

    [RelayCommand]
    private void Apply()
    {
        if (_main is null)
        {
            StatusMessage = "Shell not attached.";
            return;
        }

        var result = ConnectionAssistService.ParseConnectionText(ConnectionText);
        ParseSummary = result.Summary;
        if (!result.Success)
        {
            StatusMessage = "Nothing to apply — fix the paste text first.";
            return;
        }

        if (!string.IsNullOrWhiteSpace(result.Host))
        {
            _main.Host = result.Host;
        }

        if (result.Port is int port && port > 0)
        {
            _main.PortText = port.ToString();
        }

        if (!string.IsNullOrWhiteSpace(result.Protocol))
        {
            _main.SelectedProtocol = result.Protocol;
        }

        if (!string.IsNullOrWhiteSpace(result.Username))
        {
            _main.Username = result.Username;
        }

        if (result.Password is not null)
        {
            _main.Password = result.Password;
        }

        StatusMessage = "Applied to Connect bar.";
        AppliedToConnectBar?.Invoke(this, EventArgs.Empty);
    }

    [RelayCommand]
    private async Task RefreshDiagnosisAsync()
    {
        var hasKey = await _ai.HasApiKeyAsync().ConfigureAwait(true);
        AiModeText = hasKey
            ? $"BYOK cloud ready ({_ai.ConfiguredProvider}). Troubleshoot may call your provider."
            : "Local mode — Settings → AI (BYOK) → Gemini / OpenAI key. Checklist: docs/ai-module-checklist.md";

        if (_main is null && _log is null)
        {
            return;
        }

        try
        {
            var result = await _ai.TroubleshootAsync(new AiTroubleshootRequest
            {
                LogLines = _log?.Lines.ToArray() ?? [],
                Protocol = _main?.SelectedProtocol,
                Host = _main?.Host,
                LastCommandHint = "connect/transfer"
            }).ConfigureAwait(true);

            DiagnosisTitle = result.Title;
            DiagnosisAdvice = result.Advice;
            DiagnosisSteps = result.Steps.Count == 0
                ? string.Empty
                : string.Join(Environment.NewLine, result.Steps.Select((s, i) => $"{i + 1}. {s}"));
            if (!string.IsNullOrWhiteSpace(result.SuggestedUiAction))
            {
                DiagnosisSteps = string.IsNullOrEmpty(DiagnosisSteps)
                    ? $"Suggested: {result.SuggestedUiAction}"
                    : DiagnosisSteps + Environment.NewLine + $"Suggested: {result.SuggestedUiAction}";
            }

            StatusMessage = result.UsedCloudModel
                ? "Solved with cloud AI (BYOK)."
                : "Solved with local AI heuristics.";
        }
        catch (Exception ex)
        {
            DiagnosisTitle = "Troubleshoot failed";
            DiagnosisAdvice = ex.Message;
            DiagnosisSteps = string.Empty;
            StatusMessage = "AI troubleshoot error — check Settings → AI.";
        }
    }

    [RelayCommand]
    private void SuggestPorts()
    {
        if (_main is null)
        {
            return;
        }

        var protocol = _main.SelectedProtocol;
        var port = ConnectionAssistService.DefaultPort(protocol);
        _main.PortText = port.ToString();
        StatusMessage = $"Set port {port} for {protocol}.";
    }

    [RelayCommand]
    private async Task ParseSearchAsync()
    {
        try
        {
            var filter = await _ai.ParseSearchQueryAsync(SearchQuery).ConfigureAwait(true);
            var after = filter.ModifiedAfterUtc?.UtcDateTime.ToString("u") ?? "-";
            SearchResultText =
                $"{filter.Explanation}\n" +
                $"ext={filter.Extension ?? "-"} · contains={filter.NameContains ?? "-"} · " +
                $"min={filter.MinSizeBytes?.ToString() ?? "-"} · after={after}";
            StatusMessage = "Search filter parsed. Apply to Local or Remote listing.";
        }
        catch (Exception ex)
        {
            SearchResultText = ex.Message;
            StatusMessage = "Search parse failed.";
        }
    }

    [RelayCommand]
    private async Task ApplySearchAsync()
    {
        if (_main is null)
        {
            StatusMessage = "Shell not attached.";
            return;
        }

        try
        {
            var filter = await _ai.ParseSearchQueryAsync(SearchQuery).ConfigureAwait(true);
            var targetLocal = string.Equals(SearchTarget, "Local", StringComparison.OrdinalIgnoreCase);
            var count = targetLocal
                ? await _main.LocalBrowser.ApplyAiFilterAsync(filter).ConfigureAwait(true)
                : await _main.RemoteBrowser.ApplyAiFilterAsync(filter).ConfigureAwait(true);

            SearchResultText =
                $"{filter.Explanation}\nMatched {count} file(s) on {SearchTarget}.";
            StatusMessage = count == 0
                ? "No matches — refine the query or Clear filter on the browser."
                : $"Applied AI filter on {SearchTarget}.";
        }
        catch (Exception ex)
        {
            SearchResultText = ex.Message;
            StatusMessage = "Apply search failed.";
        }
    }

    [RelayCommand]
    private async Task PreviewBatchRenameAsync()
    {
        if (_main is null)
        {
            StatusMessage = "Shell not attached.";
            return;
        }

        var names = _main.RemoteBrowser.Items
            .Where(i => !i.IsDirectory && !i.IsParentLink)
            .Select(i => i.Name)
            .ToList();

        if (names.Count == 0)
        {
            BatchPreviewText = "No remote files in the current listing.";
            RenamePreviewLines.Clear();
            _renamePreview = null;
            return;
        }

        _renamePreview = await _ai.PreviewBatchRenameAsync(names, BatchRule).ConfigureAwait(true);
        RenamePreviewLines.Clear();
        foreach (var item in _renamePreview.Items)
        {
            RenamePreviewLines.Add($"{item.OldName} → {item.NewName}");
        }

        BatchPreviewText = _renamePreview.Items.Count == 0
            ? $"{_renamePreview.RuleSummary} — no renames produced."
            : _renamePreview.RuleSummary;
        StatusMessage = $"{_renamePreview.Items.Count} rename(s) ready to apply.";
    }

    [RelayCommand]
    private async Task ApplyBatchRenameAsync()
    {
        if (_main is null || _renamePreview is null || _renamePreview.Items.Count == 0)
        {
            StatusMessage = "Preview rename first.";
            return;
        }

        if (!_ftp.IsConnected)
        {
            StatusMessage = "Connect first to apply renames.";
            return;
        }

        var basePath = _main.RemoteBrowser.CurrentPath;
        var applied = 0;
        try
        {
            foreach (var item in _renamePreview.Items)
            {
                var from = RemotePath.Combine(basePath, item.OldName);
                var to = RemotePath.Combine(basePath, item.NewName);
                await _ftp.RenameAsync(from, to).ConfigureAwait(true);
                applied++;
            }

            await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            _log?.Info($"AI batch rename applied ({applied}).");
            StatusMessage = $"Renamed {applied} file(s).";
            RenamePreviewLines.Clear();
            _renamePreview = null;
        }
        catch (Exception ex)
        {
            _log?.Error($"Batch rename failed after {applied}: {ex.Message}");
            StatusMessage = ex.Message;
            await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
        }
    }

    [RelayCommand]
    private async Task PreviewSmartMoveAsync()
    {
        if (_main is null)
        {
            StatusMessage = "Shell not attached.";
            return;
        }

        var names = _main.RemoteBrowser.Items
            .Where(i => !i.IsDirectory && !i.IsParentLink)
            .Select(i => i.Name)
            .ToList();

        _movePreview = await _ai.PreviewSmartMoveAsync(names, BatchRule).ConfigureAwait(true);
        MovePreviewLines.Clear();
        foreach (var item in _movePreview.Items)
        {
            MovePreviewLines.Add($"{item.SourceName} → {item.DestinationRelativePath}");
        }

        BatchPreviewText = _movePreview.Items.Count == 0
            ? $"{_movePreview.RuleSummary} — nothing to move."
            : _movePreview.RuleSummary;
        StatusMessage = $"{_movePreview.Items.Count} move(s) ready to apply.";
    }

    [RelayCommand]
    private async Task ApplySmartMoveAsync()
    {
        if (_main is null || _movePreview is null || _movePreview.Items.Count == 0)
        {
            StatusMessage = "Preview smart move first.";
            return;
        }

        if (!_ftp.IsConnected)
        {
            StatusMessage = "Connect first to apply moves.";
            return;
        }

        var basePath = _main.RemoteBrowser.CurrentPath;
        var applied = 0;
        try
        {
            foreach (var item in _movePreview.Items)
            {
                var from = RemotePath.Combine(basePath, item.SourceName);
                var to = item.DestinationRelativePath.StartsWith('/')
                    ? RemotePath.Normalize(item.DestinationRelativePath)
                    : RemotePath.Combine(basePath, item.DestinationRelativePath);
                await _ftp.RenameAsync(from, to).ConfigureAwait(true);
                applied++;
            }

            await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            _log?.Info($"AI smart move applied ({applied}).");
            StatusMessage = $"Moved {applied} file(s).";
            MovePreviewLines.Clear();
            _movePreview = null;
        }
        catch (Exception ex)
        {
            _log?.Error($"Smart move failed after {applied}: {ex.Message}");
            StatusMessage = ex.Message;
            await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
        }
    }

    [RelayCommand]
    private async Task ProposeSshAsync()
    {
        RefreshConnectionFlags();
        if (!IsSshAvailable)
        {
            SshProposedCommand = string.Empty;
            SshExplanation = "SSH assist requires an active SFTP connection.";
            StatusMessage = SshExplanation;
            return;
        }

        var cwd = _main?.RemoteBrowser.CurrentPath ?? "/";
        _sshProposal = await _ai.ProposeSshCommandAsync(SshRequest, cwd).ConfigureAwait(true);
        SshProposedCommand = _sshProposal.Command;
        SshExplanation = _sshProposal.Explanation;
        SshOutput = string.Empty;
        StatusMessage = "Review the command. Approve only if you intend to run it.";
    }

    [RelayCommand]
    private async Task ApproveSshAsync()
    {
        RefreshConnectionFlags();
        if (!IsSshAvailable)
        {
            StatusMessage = "SSH assist requires an active SFTP connection.";
            return;
        }

        var command = _sshProposal?.Command ?? SshProposedCommand;
        if (string.IsNullOrWhiteSpace(command))
        {
            StatusMessage = "Propose a command first.";
            return;
        }

        try
        {
            SshOutput = await _ftp.ExecuteShellCommandAsync(command).ConfigureAwait(true);
            _log?.Info($"SSH approved: {command}");
            StatusMessage = "SSH command finished.";
            if (_main is not null)
            {
                await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            }
        }
        catch (Exception ex)
        {
            SshOutput = ex.Message;
            _log?.Error($"SSH failed: {ex.Message}");
            StatusMessage = "SSH command failed.";
        }
    }

    [RelayCommand]
    private async Task LoadQuickEditAsync()
    {
        if (!_ftp.IsConnected)
        {
            StatusMessage = "Connect first to load a remote file.";
            return;
        }

        if (string.IsNullOrWhiteSpace(QuickEditPath))
        {
            StatusMessage = "Enter a remote file path.";
            return;
        }

        try
        {
            QuickEditOriginal = await _ftp.ReadTextFileAsync(QuickEditPath).ConfigureAwait(true);
            QuickEditProposed = string.Empty;
            QuickEditSummary = $"Loaded {QuickEditOriginal.Length} chars from {QuickEditPath}.";
            StatusMessage = "File loaded — enter an instruction and Propose.";
        }
        catch (Exception ex)
        {
            QuickEditOriginal = string.Empty;
            QuickEditSummary = ex.Message;
            StatusMessage = "Load failed.";
        }
    }

    [RelayCommand]
    private async Task ProposeQuickEditAsync()
    {
        if (string.IsNullOrEmpty(QuickEditOriginal) && string.IsNullOrWhiteSpace(QuickEditPath))
        {
            StatusMessage = "Load a remote file first.";
            return;
        }

        if (string.IsNullOrEmpty(QuickEditOriginal) && _ftp.IsConnected)
        {
            await LoadQuickEditAsync().ConfigureAwait(true);
        }

        try
        {
            var proposal = await _ai.ProposeQuickEditAsync(new AiQuickEditRequest
            {
                RemotePath = QuickEditPath,
                FileContent = QuickEditOriginal,
                Instruction = QuickEditInstruction
            }).ConfigureAwait(true);

            QuickEditProposed = proposal.ProposedContent;
            QuickEditSummary = proposal.Summary;
            StatusMessage = string.Equals(proposal.OriginalContent, proposal.ProposedContent, StringComparison.Ordinal)
                ? "No change proposed."
                : "Preview ready — confirm upload to write remote file.";
        }
        catch (Exception ex)
        {
            QuickEditSummary = ex.Message;
            StatusMessage = "Quick Edit propose failed.";
        }
    }

    [RelayCommand]
    private async Task ConfirmQuickEditUploadAsync()
    {
        if (!_ftp.IsConnected)
        {
            StatusMessage = "Connect first.";
            return;
        }

        if (string.IsNullOrWhiteSpace(QuickEditPath) || QuickEditProposed.Length == 0)
        {
            StatusMessage = "Propose an edit before uploading.";
            return;
        }

        if (string.Equals(QuickEditOriginal, QuickEditProposed, StringComparison.Ordinal))
        {
            StatusMessage = "Proposed content matches original — nothing to upload.";
            return;
        }

        try
        {
            await _ftp.WriteTextFileAsync(QuickEditPath, QuickEditProposed).ConfigureAwait(true);
            QuickEditOriginal = QuickEditProposed;
            _log?.Info($"AI Quick Edit uploaded: {QuickEditPath}");
            QuickEditSummary = "Uploaded successfully.";
            StatusMessage = "Remote file updated.";
            if (_main is not null)
            {
                await _main.RemoteBrowser.RefreshCommand.ExecuteAsync(null).ConfigureAwait(true);
            }
        }
        catch (Exception ex)
        {
            _log?.Error($"Quick Edit upload failed: {ex.Message}");
            StatusMessage = ex.Message;
        }
    }
}
