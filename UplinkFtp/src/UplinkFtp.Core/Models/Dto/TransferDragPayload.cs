namespace UplinkFtp.Models.Dto;

/// <summary>Serialized into drag-and-drop transfer payloads.</summary>
public sealed class TransferDragPayload
{
    public const string DataFormatPrefix = "UplinkFtpTransfer:";

    /// <summary>Local or Remote.</summary>
    public required string Side { get; init; }

    public required string FullPath { get; init; }

    public required string Name { get; init; }

    public bool IsDirectory { get; init; }

    public static bool IsLocal(string side)
        => string.Equals(side, "Local", System.StringComparison.OrdinalIgnoreCase);

    public static bool IsRemote(string side)
        => string.Equals(side, "Remote", System.StringComparison.OrdinalIgnoreCase);
}
