using System.Threading;
using System.Threading.Tasks;
using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Services.Transfer;

/// <summary>UI (or test) callback when conflict policy is <see cref="TransferConflictAction.Ask"/>.</summary>
public interface ITransferConflictPrompt
{
    /// <summary>
    /// Ask the operator what to do for one conflicting file.
    /// Return null to treat as Skip (cancel / dismiss).
    /// </summary>
    Task<TransferConflictPromptResult?> PromptAsync(
        TransferConflictPromptRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class TransferConflictPromptRequest
{
    public required TransferJob Job { get; init; }

    public required string ConflictPath { get; init; }

    public required TransferDirection Direction { get; init; }

    /// <summary>Suggested default action from Settings.</summary>
    public TransferConflictAction SuggestedAction { get; init; } = TransferConflictAction.Overwrite;
}

public sealed class TransferConflictPromptResult
{
    public required TransferConflictAction Action { get; init; }

    /// <summary>When true, apply <see cref="Action"/> to remaining conflicts in this batch/session.</summary>
    public bool ApplyToAll { get; init; }
}
