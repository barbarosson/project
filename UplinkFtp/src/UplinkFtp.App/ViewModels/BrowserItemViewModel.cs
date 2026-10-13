using System;
using CommunityToolkit.Mvvm.ComponentModel;

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
        bool isParentLink = false)
    {
        Name = name;
        FullPath = fullPath;
        IsDirectory = isDirectory;
        Size = size;
        ModifiedUtc = modifiedUtc;
        IsParentLink = isParentLink;
    }

    public string Name { get; }

    public string FullPath { get; }

    public bool IsDirectory { get; }

    public long Size { get; }

    public DateTime? ModifiedUtc { get; }

    public bool IsParentLink { get; }

    public string Kind => IsParentLink ? "Up" : IsDirectory ? "Folder" : "File";

    public string SizeDisplay => IsDirectory || IsParentLink ? string.Empty : FormatSize(Size);

    public string ModifiedDisplay => ModifiedUtc is null
        ? string.Empty
        : ModifiedUtc.Value.ToLocalTime().ToString("g");

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
