using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;

namespace UplinkFtp.ViewModels;

/// <summary>Lazy folder node for the local drive tree (This PC → drives → folders).</summary>
public sealed partial class LocalFolderNodeViewModel : ObservableObject
{
    private bool _childrenLoaded;
    private readonly bool _canHaveChildren;

    private LocalFolderNodeViewModel(string label, string? fullPath, bool canHaveChildren, bool isDrive, bool isNavigable)
    {
        Label = label;
        FullPath = fullPath ?? string.Empty;
        _canHaveChildren = canHaveChildren;
        IsDrive = isDrive;
        IsNavigable = isNavigable && !string.IsNullOrWhiteSpace(fullPath);

        if (_canHaveChildren)
        {
            Children.Add(CreatePlaceholder());
        }
    }

    public string Label { get; }

    public string FullPath { get; }

    public bool IsDrive { get; }

    public bool IsNavigable { get; }

    public bool IsPlaceholder { get; private init; }

    public ObservableCollection<LocalFolderNodeViewModel> Children { get; } = [];

    [ObservableProperty]
    private bool _isExpanded;

    public static LocalFolderNodeViewModel CreateThisPcRoot()
        => new("This PC", fullPath: null, canHaveChildren: true, isDrive: false, isNavigable: false);

    public static LocalFolderNodeViewModel CreateDrive(DriveInfo drive)
    {
        var root = drive.RootDirectory.FullName;
        var letter = root.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        if (!drive.IsReady)
        {
            return new LocalFolderNodeViewModel(
                $"{letter} (not ready)",
                root,
                canHaveChildren: false,
                isDrive: true,
                isNavigable: false);
        }

        var detail = TryDescribeDrive(drive);
        var label = string.IsNullOrWhiteSpace(detail) ? letter : $"{letter} ({detail})";
        return new LocalFolderNodeViewModel(label, root, canHaveChildren: true, isDrive: true, isNavigable: true);
    }

    public static LocalFolderNodeViewModel CreateFolder(string path, string? displayName = null)
    {
        var name = displayName ?? Path.GetFileName(path.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar));
        if (string.IsNullOrWhiteSpace(name))
        {
            name = path;
        }

        return new LocalFolderNodeViewModel(name, path, canHaveChildren: true, isDrive: false, isNavigable: true);
    }

    public static LocalFolderNodeViewModel CreateQuickAccess(string label, string path)
        => new(label, path, canHaveChildren: true, isDrive: false, isNavigable: true);

    private static LocalFolderNodeViewModel CreatePlaceholder()
        => new("…", fullPath: null, canHaveChildren: false, isDrive: false, isNavigable: false)
        {
            IsPlaceholder = true
        };

    public void InvalidateChildren()
    {
        if (!_canHaveChildren)
        {
            return;
        }

        _childrenLoaded = false;
        Children.Clear();
        Children.Add(CreatePlaceholder());
        IsExpanded = false;
    }

    public async Task EnsureChildrenLoadedAsync(bool includeHidden)
    {
        if (!_canHaveChildren || _childrenLoaded)
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(FullPath))
        {
            // This PC root is populated by the browser VM (drives), not here.
            _childrenLoaded = true;
            return;
        }

        var path = FullPath;
        var nodes = await Task.Run(() => EnumerateChildFolders(path, includeHidden)).ConfigureAwait(true);
        Children.Clear();
        foreach (var node in nodes)
        {
            Children.Add(node);
        }

        _childrenLoaded = true;
    }

    public void SetChildren(IEnumerable<LocalFolderNodeViewModel> children)
    {
        Children.Clear();
        foreach (var child in children)
        {
            Children.Add(child);
        }

        _childrenLoaded = true;
    }

    private static System.Collections.Generic.List<LocalFolderNodeViewModel> EnumerateChildFolders(string path, bool includeHidden)
    {
        var list = new System.Collections.Generic.List<LocalFolderNodeViewModel>();
        try
        {
            if (!Directory.Exists(path))
            {
                return list;
            }

            foreach (var dir in Directory.EnumerateDirectories(path).OrderBy(d => d, StringComparer.OrdinalIgnoreCase))
            {
                try
                {
                    var info = new DirectoryInfo(dir);
                    if (!includeHidden && IsHidden(info))
                    {
                        continue;
                    }

                    list.Add(CreateFolder(info.FullName, info.Name));
                }
                catch (UnauthorizedAccessException)
                {
                    // Skip locked subdirectory entries.
                }
                catch (IOException)
                {
                }
            }
        }
        catch (UnauthorizedAccessException)
        {
            list.Add(new LocalFolderNodeViewModel("(Access denied)", path, canHaveChildren: false, isDrive: false, isNavigable: false));
        }
        catch (IOException)
        {
            list.Add(new LocalFolderNodeViewModel("(Unavailable)", path, canHaveChildren: false, isDrive: false, isNavigable: false));
        }

        return list;
    }

    private static string TryDescribeDrive(DriveInfo drive)
    {
        try
        {
            if (!string.IsNullOrWhiteSpace(drive.VolumeLabel))
            {
                return drive.VolumeLabel;
            }

            return drive.DriveType.ToString();
        }
        catch
        {
            return drive.DriveType.ToString();
        }
    }

    private static bool IsHidden(DirectoryInfo info)
    {
        if (info.Name.StartsWith(".", StringComparison.Ordinal))
        {
            return true;
        }

        try
        {
            return (info.Attributes & FileAttributes.Hidden) != 0;
        }
        catch
        {
            return false;
        }
    }
}
