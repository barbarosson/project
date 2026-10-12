using System;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Models.Dto;

/// <summary>Immutable identity + mutable progress/state for a queued transfer.</summary>
public sealed class TransferJob
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public TransferDirection Direction { get; init; }

    public string Source { get; init; } = string.Empty;

    /// <summary>May be rewritten by conflict AutoRename before transfer starts.</summary>
    public string Destination { get; set; } = string.Empty;

    public bool IsDirectory { get; init; }

    public TransferConflictPolicy ConflictPolicy { get; init; } = TransferConflictPolicy.Default;

    public string DisplayName { get; init; } = string.Empty;

    public DateTimeOffset EnqueuedAt { get; init; } = DateTimeOffset.Now;

    public TransferJobState State { get; set; } = TransferJobState.Queued;

    public double ProgressPercent { get; set; }

    public long BytesTransferred { get; set; }

    public long? TotalBytes { get; set; }

    /// <summary>Byte offset to continue from after pause (file transfers only).</summary>
    public long ResumeOffsetBytes { get; set; }

    /// <summary>True when pause/resume can continue from <see cref="ResumeOffsetBytes"/>.</summary>
    public bool SupportsResume { get; set; }

    public string? Detail { get; set; }

    public string? Error { get; set; }

    public DateTimeOffset? StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }
}
