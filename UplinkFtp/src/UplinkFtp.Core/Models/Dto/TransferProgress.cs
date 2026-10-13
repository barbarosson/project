namespace UplinkFtp.Models.Dto;

/// <summary>Progress snapshot for single-file or directory transfers.</summary>
public sealed class TransferProgress
{
    public long BytesTransferred { get; init; }

    public long? TotalBytes { get; init; }

    public string? CurrentPath { get; init; }

    public double? PercentComplete =>
        TotalBytes is > 0 ? Math.Clamp(100.0 * BytesTransferred / TotalBytes.Value, 0, 100) : null;
}
