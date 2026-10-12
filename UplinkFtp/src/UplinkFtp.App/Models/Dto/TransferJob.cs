using System;
using UplinkFtp.Models.Enums;

namespace UplinkFtp.Models.Dto;

/// <summary>Immutable identity + mutable progress/state for a queued transfer.</summary>
public sealed class TransferJob
{
    public Guid Id { get; init; } = Guid.NewGuid();

    public TransferDirection Direction { get; init; }

    public string Source { get; init; } = string.Empty;

    public string Destination { get; init; } = string.Empty;

    public bool IsDirectory { get; init; }

    public string DisplayName { get; init; } = string.Empty;

    public DateTimeOffset EnqueuedAt { get; init; } = DateTimeOffset.Now;

    public TransferJobState State { get; set; } = TransferJobState.Queued;

    public double ProgressPercent { get; set; }

    public long BytesTransferred { get; set; }

    public long? TotalBytes { get; set; }

    public string? Detail { get; set; }

    public string? Error { get; set; }

    public DateTimeOffset? StartedAt { get; set; }

    public DateTimeOffset? CompletedAt { get; set; }
}
