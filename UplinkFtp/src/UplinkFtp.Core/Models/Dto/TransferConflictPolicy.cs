using UplinkFtp.Models.Enums;

namespace UplinkFtp.Models.Dto;

/// <summary>Conflict resolution policy applied by the transfer queue.</summary>
public sealed class TransferConflictPolicy
{
    public static TransferConflictPolicy Default { get; } = new();

    public TransferConflictAction Action { get; init; } = TransferConflictAction.Overwrite;

    /// <summary>When true, UI should prompt per conflicting file; otherwise apply <see cref="Action"/> to all.</summary>
    public bool PromptPerFile { get; init; }
}
