using System;
using System.Collections.Generic;
using System.Linq;
using UplinkFtp.Services.Ai;
using UplinkFtp.ViewModels;

namespace UplinkFtp.Helpers;

public enum BrowserSortColumn
{
    Name,
    Kind,
    Size,
    Modified
}

/// <summary>Shared filter + sort for local/remote browser listings.</summary>
public static class BrowserListingHelper
{
    public static IReadOnlyList<BrowserItemViewModel> Present(
        IReadOnlyList<BrowserItemViewModel> fullListing,
        AiFileFilter? filter,
        BrowserSortColumn sortColumn,
        bool ascending)
    {
        var parents = fullListing.Where(i => i.IsParentLink);
        IEnumerable<BrowserItemViewModel> rows = fullListing.Where(i => !i.IsParentLink);

        if (filter is not null)
        {
            rows = rows.Where(i =>
                AiFileFilterMatcher.Matches(i.Name, i.IsDirectory, i.Size, i.ModifiedUtc, filter));
        }

        rows = Sort(rows, sortColumn, ascending);
        return parents.Concat(rows).ToList();
    }

    public static string SortHeaderLabel(string title, BrowserSortColumn column, BrowserSortColumn active, bool ascending)
    {
        if (column != active)
        {
            return title;
        }

        return ascending ? $"{title} ↑" : $"{title} ↓";
    }

    private static IEnumerable<BrowserItemViewModel> Sort(
        IEnumerable<BrowserItemViewModel> rows,
        BrowserSortColumn column,
        bool ascending)
    {
        // Folders first within a stable secondary Name order (except when sorting by Kind/Name explicitly).
        return column switch
        {
            BrowserSortColumn.Kind => Order(rows, i => i.Kind, ascending, secondaryName: true),
            BrowserSortColumn.Size => Order(rows, i => i.IsDirectory ? -1L : i.Size, ascending, secondaryName: true),
            BrowserSortColumn.Modified => Order(
                rows,
                i => i.ModifiedUtc ?? DateTime.MinValue,
                ascending,
                secondaryName: true),
            _ => Order(rows, i => i.Name, ascending, secondaryName: false, nameComparer: true)
        };
    }

    private static IEnumerable<BrowserItemViewModel> Order<TKey>(
        IEnumerable<BrowserItemViewModel> rows,
        Func<BrowserItemViewModel, TKey> key,
        bool ascending,
        bool secondaryName,
        bool nameComparer = false)
    {
        IOrderedEnumerable<BrowserItemViewModel> ordered;
        if (nameComparer)
        {
            ordered = ascending
                ? rows.OrderBy(i => i.IsDirectory ? 0 : 1)
                    .ThenBy(i => i.Name, StringComparer.OrdinalIgnoreCase)
                : rows.OrderBy(i => i.IsDirectory ? 0 : 1)
                    .ThenByDescending(i => i.Name, StringComparer.OrdinalIgnoreCase);
            return ordered;
        }

        ordered = ascending
            ? rows.OrderBy(i => i.IsDirectory ? 0 : 1).ThenBy(key)
            : rows.OrderBy(i => i.IsDirectory ? 0 : 1).ThenByDescending(key);

        if (secondaryName)
        {
            ordered = ascending
                ? ordered.ThenBy(i => i.Name, StringComparer.OrdinalIgnoreCase)
                : ordered.ThenByDescending(i => i.Name, StringComparer.OrdinalIgnoreCase);
        }

        return ordered;
    }
}
