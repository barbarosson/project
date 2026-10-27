using System;
using CommunityToolkit.Mvvm.ComponentModel;
using UplinkFtp.Services.Browse;

namespace UplinkFtp.ViewModels;

/// <summary>Row in local or remote file lists.</summary>
public sealed partial class BrowserItemViewModel : ObservableObject
{
    public BrowserItemViewModel(
        string name,
        string fullPath,
        bool isDirectory,
        long size,
        DateTime? modifiedUtc,
        bool isParentLink = false,
        bool isSymlink = false,
        string? linkTarget = null,
        int? unixMode = null)
    {
        Name = name;
        FullPath = fullPath;
        IsDirectory = isDirectory;
        Size = size;
        ModifiedUtc = modifiedUtc;
        IsParentLink = isParentLink;
        IsSymlink = isSymlink;
        LinkTarget = linkTarget;
        UnixMode = unixMode;
    }

    public string Name { get; }

    public string FullPath { get; }

    public bool IsDirectory { get; }

    public long Size { get; }

    public DateTime? ModifiedUtc { get; }

    public bool IsParentLink { get; }

    public bool IsSymlink { get; }

    public string? LinkTarget { get; }

    public int? UnixMode { get; }

    public bool IsHidden => !IsParentLink && Name.StartsWith(".", StringComparison.Ordinal);

    public string Kind => IsParentLink
        ? "Up"
        : IsSymlink
            ? (IsDirectory ? "Link→Folder" : "Link")
            : IsDirectory
                ? "Folder"
                : "File";

    public string SizeDisplay => IsDirectory || IsParentLink ? string.Empty : FormatSize(Size);

    public string ModifiedDisplay => ModifiedUtc is null
        ? string.Empty
        : ModifiedUtc.Value.ToLocalTime().ToString("g");

    [ObservableProperty]
    private DirectoryCompareStatus _compareStatus = DirectoryCompareStatus.Same;

    public bool HasCompareHighlight => CompareStatus is not DirectoryCompareStatus.Same;

    public string CompareLabel => CompareStatus switch
    {
        DirectoryCompareStatus.LocalOnly => "Local",
        DirectoryCompareStatus.RemoteOnly => "Remote",
        DirectoryCompareStatus.SizeDiffers => "Size≠",
        DirectoryCompareStatus.DateDiffers => "Date≠",
        _ => string.Empty
    };

    public string ModeDisplay => UnixMode is int mode
        ? Convert.ToString(mode & 0x1FF, 8).PadLeft(3, '0')
        : string.Empty;

    partial void OnCompareStatusChanged(DirectoryCompareStatus value)
    {
        OnPropertyChanged(nameof(HasCompareHighlight));
        OnPropertyChanged(nameof(CompareLabel));
    }

    private static string FormatSize(long bytes)
    {
        string[] units = ["B", "KB", "MB", "GB", "TB"];
        double value = bytes;
        var unit = 0;
        while (value >= 1024 && unit < units.Length - 1)
        {
            value /= 1024;
            unit++;
        }

        return unit == 0 ? $"{bytes} {units[unit]}" : $"{value:0.##} {units[unit]}";
    }
}
