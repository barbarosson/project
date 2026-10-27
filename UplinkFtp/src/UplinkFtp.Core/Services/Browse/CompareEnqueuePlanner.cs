using System;
using System.Collections.Generic;
using System.Linq;

namespace UplinkFtp.Services.Browse;

/// <summary>Turns compare highlights into upload/download enqueue candidates.</summary>
public enum CompareEnqueueMode
{
    /// <summary>Local-only + differing → upload; remote-only ignored.</summary>
    UploadDifferences = 0,

    /// <summary>Remote-only + differing → download; local-only ignored.</summary>
    DownloadDifferences = 1,

    /// <summary>Upload local-only/diffs and download remote-only (both sides).</summary>
    BothWays = 2
}

public sealed class CompareEnqueueItem
{
    public required string Name { get; init; }

    public required bool Upload { get; init; }

    public DirectoryCompareStatus Status { get; init; }
}

public static class CompareEnqueuePlanner
{
    public static IReadOnlyList<CompareEnqueueItem> Plan(
        IReadOnlyList<DirectoryCompareRow> rows,
        CompareEnqueueMode mode)
    {
        ArgumentNullException.ThrowIfNull(rows);
        var list = new List<CompareEnqueueItem>();

        foreach (var row in rows.Where(r => r.Status != DirectoryCompareStatus.Same))
        {
            switch (mode)
            {
                case CompareEnqueueMode.UploadDifferences:
                    if (row.Status is DirectoryCompareStatus.LocalOnly
                        or DirectoryCompareStatus.SizeDiffers
                        or DirectoryCompareStatus.DateDiffers)
                    {
                        list.Add(new CompareEnqueueItem
                        {
                            Name = row.Name,
                            Upload = true,
                            Status = row.Status
                        });
                    }

                    break;

                case CompareEnqueueMode.DownloadDifferences:
                    if (row.Status is DirectoryCompareStatus.RemoteOnly
                        or DirectoryCompareStatus.SizeDiffers
                        or DirectoryCompareStatus.DateDiffers)
                    {
                        list.Add(new CompareEnqueueItem
                        {
                            Name = row.Name,
                            Upload = false,
                            Status = row.Status
                        });
                    }

                    break;

                case CompareEnqueueMode.BothWays:
                    if (row.Status == DirectoryCompareStatus.LocalOnly)
                    {
                        list.Add(new CompareEnqueueItem { Name = row.Name, Upload = true, Status = row.Status });
                    }
                    else if (row.Status == DirectoryCompareStatus.RemoteOnly)
                    {
                        list.Add(new CompareEnqueueItem { Name = row.Name, Upload = false, Status = row.Status });
                    }
                    else if (row.Status is DirectoryCompareStatus.SizeDiffers or DirectoryCompareStatus.DateDiffers)
                    {
                        // Prefer upload for size/date diffs in both-ways (local is source of truth).
                        list.Add(new CompareEnqueueItem { Name = row.Name, Upload = true, Status = row.Status });
                    }

                    break;
            }
        }

        return list;
    }
}
