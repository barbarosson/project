using UplinkFtp.Models.Dto;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Core.Tests;

public sealed class TransferQueuePersistenceTests
{
    [Fact]
    public async Task Save_Load_preserves_queued_and_failed_with_directory_checkpoint()
    {
        var path = Path.Combine(Path.GetTempPath(), "uplink-queue-" + Guid.NewGuid().ToString("N") + ".json");
        try
        {
            var store = new JsonTransferQueuePersistence(path);
            var jobs = new List<TransferJob>
            {
                new()
                {
                    Direction = TransferDirection.Upload,
                    Source = @"C:\local\a",
                    Destination = "/remote/a",
                    IsDirectory = true,
                    DisplayName = "a",
                    State = TransferJobState.Paused,
                    SupportsResume = true,
                    CompletedRelativePaths = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "f1.txt", "sub/f2.txt" },
                    ConflictPolicy = new TransferConflictPolicy { Action = TransferConflictAction.Ask }
                },
                new()
                {
                    Direction = TransferDirection.Download,
                    Source = "/remote/b.bin",
                    Destination = @"C:\local\b.bin",
                    IsDirectory = false,
                    DisplayName = "b.bin",
                    State = TransferJobState.Failed,
                    Error = "timeout",
                    SupportsResume = true,
                    ResumeOffsetBytes = 42
                },
                new()
                {
                    Direction = TransferDirection.Upload,
                    Source = @"C:\local\ok",
                    Destination = "/remote/ok",
                    DisplayName = "ok",
                    State = TransferJobState.Successful
                }
            };

            await store.SaveAsync(jobs);
            var loaded = await store.LoadAsync();

            Assert.Equal(2, loaded.Count);
            var dir = Assert.Single(loaded, j => j.IsDirectory);
            Assert.Equal(TransferJobState.Paused, dir.State);
            Assert.Contains("f1.txt", dir.CompletedRelativePaths);
            Assert.Contains("sub/f2.txt", dir.CompletedRelativePaths);
            Assert.Equal(TransferConflictAction.Ask, dir.ConflictPolicy.Action);

            var failed = Assert.Single(loaded, j => j.State == TransferJobState.Failed);
            Assert.Equal(42, failed.ResumeOffsetBytes);
            Assert.Equal("timeout", failed.Error);
        }
        finally
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}
