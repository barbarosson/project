using System;
using System.Collections.Generic;
using FtpAi.Models.Dto;

namespace FtpAi.Services.Transfer;

/// <summary>
/// Concurrent transfer queue. Workers respect <see cref="Licensing.ILicenseService.GetMaxConcurrentTransfers"/>.
/// </summary>
public interface ITransferQueueService
{
    event EventHandler? QueueChanged;

    event EventHandler<TransferJob>? JobUpdated;

    IReadOnlyList<TransferJob> GetSnapshot();

    TransferJob EnqueueUpload(string localPath, string remotePath, bool isDirectory);

    TransferJob EnqueueDownload(string remotePath, string localPath, bool isDirectory);

    /// <summary>Cancels a running job and marks it Paused (restart-on-resume).</summary>
    bool Pause(Guid jobId);

    /// <summary>Re-queues a paused/failed job. Restarts from the beginning (not byte-resume).</summary>
    bool Resume(Guid jobId);

    bool Cancel(Guid jobId);

    bool Retry(Guid jobId);

    void ClearSuccessful();

    void ClearFailed();

    int ActiveCount { get; }

    int MaxConcurrent { get; }
}
