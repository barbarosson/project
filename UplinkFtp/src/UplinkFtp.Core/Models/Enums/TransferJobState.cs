namespace UplinkFtp.Models.Enums;

public enum TransferJobState
{
    Queued = 0,
    Running = 1,
    Paused = 2,
    Failed = 3,
    Successful = 4,
    Cancelled = 5
}

public enum TransferDirection
{
    Upload = 0,
    Download = 1
}
