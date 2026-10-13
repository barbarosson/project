using System;
using System.Collections.Generic;
using System.Linq;

namespace UplinkFtp.Services.Browse;

public sealed class DirectoryCompareService : IDirectoryCompareService
{
    public IReadOnlyList<DirectoryCompareRow> Compare(
        IEnumerable<FileListFingerprint> local,
        IEnumerable<FileListFingerprint> remote)
    {
        var left = local
            .Where(i => !string.Equals(i.Name, "..", StringComparison.Ordinal))
            .ToDictionary(i => i.Name, StringComparer.OrdinalIgnoreCase);
        var right = remote
            .Where(i => !string.Equals(i.Name, "..", StringComparison.Ordinal))
            .ToDictionary(i => i.Name, StringComparer.OrdinalIgnoreCase);

        var names = left.Keys.Union(right.Keys, StringComparer.OrdinalIgnoreCase)
            .OrderBy(n => n, StringComparer.OrdinalIgnoreCase)
            .ToList();

        var rows = new List<DirectoryCompareRow>(names.Count);
        foreach (var name in names)
        {
            left.TryGetValue(name, out var l);
            right.TryGetValue(name, out var r);
            DirectoryCompareStatus status;
            if (l is null)
            {
                status = DirectoryCompareStatus.RemoteOnly;
            }
            else if (r is null)
            {
                status = DirectoryCompareStatus.LocalOnly;
            }
            else if (l.IsDirectory != r.IsDirectory)
            {
                status = DirectoryCompareStatus.SizeDiffers;
            }
            else if (!l.IsDirectory && l.Size != r.Size)
            {
                status = DirectoryCompareStatus.SizeDiffers;
            }
            else if (l.ModifiedUtc is DateTime lm && r.ModifiedUtc is DateTime rm
                     && Math.Abs((lm - rm).TotalSeconds) > 2)
            {
                status = DirectoryCompareStatus.DateDiffers;
            }
            else
            {
                status = DirectoryCompareStatus.Same;
            }

            rows.Add(new DirectoryCompareRow { Name = name, Status = status });
        }

        return rows;
    }
}
