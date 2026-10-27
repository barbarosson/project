using UplinkFtp.Services.Browse;

namespace UplinkFtp.Core.Tests;

public sealed class CompareEnqueueAndSyncTests
{
    private static IReadOnlyList<DirectoryCompareRow> SampleRows() =>
    [
        new() { Name = "only-local.txt", Status = DirectoryCompareStatus.LocalOnly },
        new() { Name = "only-remote.txt", Status = DirectoryCompareStatus.RemoteOnly },
        new() { Name = "diff.txt", Status = DirectoryCompareStatus.SizeDiffers },
        new() { Name = "same.txt", Status = DirectoryCompareStatus.Same }
    ];

    [Fact]
    public void CompareEnqueue_upload_mode_skips_remote_only()
    {
        var plan = CompareEnqueuePlanner.Plan(SampleRows(), CompareEnqueueMode.UploadDifferences);
        Assert.Contains(plan, p => p.Name == "only-local.txt" && p.Upload);
        Assert.Contains(plan, p => p.Name == "diff.txt" && p.Upload);
        Assert.DoesNotContain(plan, p => p.Name == "only-remote.txt");
        Assert.DoesNotContain(plan, p => p.Name == "same.txt");
    }

    [Fact]
    public void CompareEnqueue_download_mode_skips_local_only()
    {
        var plan = CompareEnqueuePlanner.Plan(SampleRows(), CompareEnqueueMode.DownloadDifferences);
        Assert.Contains(plan, p => p.Name == "only-remote.txt" && !p.Upload);
        Assert.Contains(plan, p => p.Name == "diff.txt" && !p.Upload);
        Assert.DoesNotContain(plan, p => p.Name == "only-local.txt");
    }

    [Fact]
    public void DirectorySync_local_to_remote_dry_run_without_deletes()
    {
        var sut = new DirectorySyncService();
        var plan = sut.BuildPlan(SampleRows(), DirectorySyncDirection.LocalToRemote, deleteExtras: false);
        Assert.Equal(2, plan.UploadCount);
        Assert.Equal(0, plan.DeleteCount);
        Assert.DoesNotContain(plan.Items, i => i.Name == "only-remote.txt");
    }

    [Fact]
    public void DirectorySync_local_to_remote_with_deletes()
    {
        var sut = new DirectorySyncService();
        var plan = sut.BuildPlan(SampleRows(), DirectorySyncDirection.LocalToRemote, deleteExtras: true);
        Assert.Equal(1, plan.DeleteCount);
        Assert.Contains(plan.Items, i => i.Action == DirectorySyncAction.DeleteRemote && i.Name == "only-remote.txt");
    }
}
