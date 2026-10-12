using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace UplinkFtp.Services.Ai;

/// <summary>
/// Modular AI surface for Uplink FTP. Cloud LLM use requires BYOK; otherwise local heuristics.
/// </summary>
public interface IAiAssistantService
{
    /// <summary>True when a user API key is stored (Credential Locker).</summary>
    Task<bool> HasApiKeyAsync(CancellationToken cancellationToken = default);

    AiProviderKind ConfiguredProvider { get; }

    bool IsCapabilityAvailable(AiCapability capability);

    Task<AiTroubleshootResult> TroubleshootAsync(
        AiTroubleshootRequest request,
        CancellationToken cancellationToken = default);

    Task<AiFileFilter> ParseSearchQueryAsync(
        string naturalLanguageQuery,
        CancellationToken cancellationToken = default);

    Task<AiRenamePreview> PreviewBatchRenameAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default);

    Task<AiMovePreview> PreviewSmartMoveAsync(
        IReadOnlyList<string> fileNames,
        string naturalLanguageRule,
        CancellationToken cancellationToken = default);

    Task<AiSshCommandProposal> ProposeSshCommandAsync(
        string naturalLanguageRequest,
        string currentRemotePath,
        CancellationToken cancellationToken = default);

    Task<AiQuickEditProposal> ProposeQuickEditAsync(
        AiQuickEditRequest request,
        CancellationToken cancellationToken = default);
}
