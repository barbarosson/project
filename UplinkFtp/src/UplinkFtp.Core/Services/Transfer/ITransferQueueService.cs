using System;
using System.Collections.Generic;
using UplinkFtp.Models.Dto;

namespace UplinkFtp.Services.Transfer;

/// <summary>
/// Concurrent transfer queue. Workers respect <see cref="Licensing.ILicenseService.GetMaxConcurrentTransfers"/>.
/// File jobs support byte-level pause/resume via <see cref="TransferJob.ResumeOffsetBytes"/>.
/// </summary>
public interface ITransferQueueService
{
    event EventHandler? QueueChanged;

    event EventHandler<TransferJob>? JobUpdated;

    IReadOnlyList<TransferJob> GetSnapshot();

    TransferJob EnqueueUpload(string localPath, string remotePath, bool isDirectory);

    TransferJob EnqueueDownload(string remotePath, string localPath, bool isDirectory);

    /// <summary>Cancels a running job and marks it Paused (keeps resume offset for files).</summary>
    bool Pause(Guid jobId);

    /// <summary>Re-queues a paused/failed job. Files continue from <see cref="TransferJob.ResumeOffsetBytes"/>.</summary>
    bool Resume(Guid jobId);

    bool Cancel(Guid jobId);

    bool Retry(Guid jobId);

    void ClearSuccessful();

    void ClearFailed();

    int ActiveCount { get; }

    int MaxConcurrent { get; }
}
