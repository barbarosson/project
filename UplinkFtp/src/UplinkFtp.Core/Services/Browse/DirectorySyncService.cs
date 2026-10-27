using System;
using System.Collections.Generic;
using System.Linq;

namespace UplinkFtp.Services.Browse;

/// <summary>One-way mirror plan from compare rows (Pro Sync feature).</summary>
public enum DirectorySyncDirection
{
    /// <summary>Push local → remote (upload missing/differing; optionally delete remote-only).</summary>
    LocalToRemote = 0,

    /// <summary>Pull remote → local (download missing/differing; optionally delete local-only).</summary>
    RemoteToLocal = 1
}

public sealed class DirectorySyncPlanItem
{
    public required string Name { get; init; }

    public required DirectorySyncAction Action { get; init; }

    public DirectoryCompareStatus CompareStatus { get; init; }
}

public enum DirectorySyncAction
{
    Upload = 0,
    Download = 1,
    DeleteLocal = 2,
    DeleteRemote = 3,
    Skip = 4
}

public sealed class DirectorySyncPlan
{
    public required DirectorySyncDirection Direction { get; init; }

    public bool DeleteExtras { get; init; }

    public IReadOnlyList<DirectorySyncPlanItem> Items { get; init; } = [];

    public int UploadCount => Items.Count(i => i.Action == DirectorySyncAction.Upload);

    public int DownloadCount => Items.Count(i => i.Action == DirectorySyncAction.Download);

    public int DeleteCount => Items.Count(i =>
        i.Action is DirectorySyncAction.DeleteLocal or DirectorySyncAction.DeleteRemote);
}

public interface IDirectorySyncService
{
    /// <summary>
    /// Build a dry-run plan from compare rows. Does not touch the network.
    /// Caller enqueues / deletes after operator confirms.
    /// </summary>
    DirectorySyncPlan BuildPlan(
        IReadOnlyList<DirectoryCompareRow> compareRows,
        DirectorySyncDirection direction,
        bool deleteExtras);
}

public sealed class DirectorySyncService : IDirectorySyncService
{
    public DirectorySyncPlan BuildPlan(
        IReadOnlyList<DirectoryCompareRow> compareRows,
        DirectorySyncDirection direction,
        bool deleteExtras)
    {
        ArgumentNullException.ThrowIfNull(compareRows);
        var items = new List<DirectorySyncPlanItem>();

        foreach (var row in compareRows)
        {
            if (row.Status == DirectoryCompareStatus.Same)
            {
                continue;
            }

            var action = ResolveAction(row.Status, direction, deleteExtras);
            if (action == DirectorySyncAction.Skip)
            {
                continue;
            }

            items.Add(new DirectorySyncPlanItem
            {
                Name = row.Name,
                Action = action,
                CompareStatus = row.Status
            });
        }

        return new DirectorySyncPlan
        {
            Direction = direction,
            DeleteExtras = deleteExtras,
            Items = items
        };
    }

    private static DirectorySyncAction ResolveAction(
        DirectoryCompareStatus status,
        DirectorySyncDirection direction,
        bool deleteExtras)
    {
        if (direction == DirectorySyncDirection.LocalToRemote)
        {
            return status switch
            {
                DirectoryCompareStatus.LocalOnly => DirectorySyncAction.Upload,
                DirectoryCompareStatus.SizeDiffers or DirectoryCompareStatus.DateDiffers
                    => DirectorySyncAction.Upload,
                DirectoryCompareStatus.RemoteOnly => deleteExtras
                    ? DirectorySyncAction.DeleteRemote
                    : DirectorySyncAction.Skip,
                _ => DirectorySyncAction.Skip
            };
        }

        return status switch
        {
            DirectoryCompareStatus.RemoteOnly => DirectorySyncAction.Download,
            DirectoryCompareStatus.SizeDiffers or DirectoryCompareStatus.DateDiffers
                => DirectorySyncAction.Download,
            DirectoryCompareStatus.LocalOnly => deleteExtras
                ? DirectorySyncAction.DeleteLocal
                : DirectorySyncAction.Skip,
            _ => DirectorySyncAction.Skip
        };
    }
}
