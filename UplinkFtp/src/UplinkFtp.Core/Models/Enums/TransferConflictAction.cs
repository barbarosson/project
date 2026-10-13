namespace UplinkFtp.Models.Enums;

/// <summary>What to do when the destination already has the same name.</summary>
public enum TransferConflictAction
{
    Overwrite = 0,
    Skip = 1,
    OverwriteIfNewer = 2,
    AutoRename = 3,
    Resume = 4
}
