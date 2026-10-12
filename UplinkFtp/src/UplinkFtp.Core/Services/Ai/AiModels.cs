using System.Collections.Generic;

namespace UplinkFtp.Services.Ai;

public enum AiProviderKind
{
    None = 0,
    OpenAi = 1,
    Anthropic = 2
}

public enum AiCapability
{
    Troubleshoot = 1,
    NaturalLanguageSearch = 2,
    BatchRename = 3,
    SmartMove = 4,
    SshCommand = 5,
    QuickEdit = 6
}

public sealed class AiTroubleshootRequest
{
    public IReadOnlyList<string> LogLines { get; init; } = [];
    public string? Protocol { get; init; }
    public string? Host { get; init; }
    public string? LastCommandHint { get; init; }
}

public sealed class AiTroubleshootResult
{
    public required string Title { get; init; }
    public required string Advice { get; init; }
    public IReadOnlyList<string> Steps { get; init; } = [];
    public string? SuggestedUiAction { get; init; }
    public bool UsedCloudModel { get; init; }
}

public sealed class AiFileFilter
{
    public string? NameContains { get; init; }
    public string? Extension { get; init; }
    public long? MinSizeBytes { get; init; }
    public long? MaxSizeBytes { get; init; }
    public System.DateTimeOffset? ModifiedAfterUtc { get; init; }
    public System.DateTimeOffset? ModifiedBeforeUtc { get; init; }
    public string? RawQuery { get; init; }
    public string Explanation { get; init; } = string.Empty;
}

public sealed class AiRenamePreviewItem
{
    public required string OldName { get; init; }
    public required string NewName { get; init; }
}

public sealed class AiRenamePreview
{
    public IReadOnlyList<AiRenamePreviewItem> Items { get; init; } = [];
    public string RuleSummary { get; init; } = string.Empty;
}

public sealed class AiMovePreviewItem
{
    public required string SourceName { get; init; }
    public required string DestinationRelativePath { get; init; }
}

public sealed class AiMovePreview
{
    public IReadOnlyList<AiMovePreviewItem> Items { get; init; } = [];
    public string RuleSummary { get; init; } = string.Empty;
}

public sealed class AiSshCommandProposal
{
    public required string Command { get; init; }
    public string Explanation { get; init; } = string.Empty;
    /// <summary>Always false until an explicit approve+execute path exists.</summary>
    public bool AutoExecuteAllowed => false;
}

public sealed class AiQuickEditRequest
{
    public required string RemotePath { get; init; }
    public required string FileContent { get; init; }
    public required string Instruction { get; init; }
}

public sealed class AiQuickEditProposal
{
    public required string OriginalContent { get; init; }
    public required string ProposedContent { get; init; }
    public string Summary { get; init; } = string.Empty;
}
