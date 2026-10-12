using System;
using System.Threading.Tasks;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using UplinkFtp.Models.Dto;
using UplinkFtp.ViewModels;
using Windows.ApplicationModel.DataTransfer;

namespace UplinkFtp.Helpers;

/// <summary>
/// Builds browser context menus and runs rename / delete / create / chmod / move dialogs.
/// </summary>
public sealed class BrowserContextMenuManager
{
    private readonly MainViewModel _shell;
    private readonly XamlRoot _xamlRoot;

    public BrowserContextMenuManager(MainViewModel shell, XamlRoot xamlRoot)
    {
        _shell = shell;
        _xamlRoot = xamlRoot;
    }

    public MenuFlyout BuildRemoteMenu(RemoteBrowserViewModel browser)
    {
        var flyout = new MenuFlyout();

        flyout.Items.Add(Item("Open", async () =>
        {
            if (browser.SelectedItem is { } item)
            {
                await browser.OpenItemCommand.ExecuteAsync(item).ConfigureAwait(true);
            }
        }, () => browser.SelectedItem is { IsDirectory: true } or { IsParentLink: true } or { IsSymlink: true }));

        flyout.Items.Add(Item("Download", () =>
        {
            if (browser.SelectedItem is { } item)
            {
                _shell.EnqueueSelectedDownload(item);
            }
        }, () => browser.IsConnected && browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(new MenuFlyoutSeparator());

        flyout.Items.Add(Item("Rename…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            var name = await PromptTextAsync("Rename", "New name", item.Name).ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.RenameSelectedAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Renamed → {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("Delete…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            if (!await ConfirmAsync("Delete", $"Delete '{item.Name}'?").ConfigureAwait(true))
            {
                return;
            }

            try
            {
                await browser.DeleteSelectedAsync().ConfigureAwait(true);
                _shell.Log.Info($"Deleted {item.Name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("New folder…", async () =>
        {
            var name = await PromptTextAsync("New folder", "Folder name", "New folder").ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.CreateDirectoryAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Created folder {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.IsConnected));

        flyout.Items.Add(Item("New file…", async () =>
        {
            var name = await PromptTextAsync("New file", "File name", "new.txt").ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.CreateEmptyFileAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Created file {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.IsConnected));

        flyout.Items.Add(Item("Move…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            var dest = await PromptTextAsync("Move", "Destination directory", browser.CurrentPath)
                .ConfigureAwait(true);
            if (dest is null)
            {
                return;
            }

            try
            {
                await browser.MoveSelectedAsync(dest).ConfigureAwait(true);
                _shell.Log.Info($"Moved {item.Name} → {dest}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("Permissions…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            var current = item.UnixMode is int mode
                ? new UnixFilePermissions(mode).ToOctalString()
                : "644";
            var octal = await PromptTextAsync("Permissions", "Unix mode (octal)", current)
                .ConfigureAwait(true);
            if (octal is null)
            {
                return;
            }

            try
            {
                var perms = UnixFilePermissions.FromOctalString(octal);
                await browser.SetPermissionsAsync(perms).ConfigureAwait(true);
                _shell.Log.Info($"chmod {perms.ToOctalString()} {item.Name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("Calculate size", async () =>
        {
            try
            {
                await browser.CalculateSelectedSizeAsync().ConfigureAwait(true);
                if (!string.IsNullOrWhiteSpace(browser.DirectorySizeText))
                {
                    await MessageAsync("Directory size", browser.DirectorySizeText).ConfigureAwait(true);
                }
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsDirectory: true, IsParentLink: false }));

        flyout.Items.Add(new MenuFlyoutSeparator());

        flyout.Items.Add(Item("Copy path", () =>
        {
            if (browser.SelectedItem is { } item)
            {
                CopyText(item.FullPath);
                _shell.Log.Info($"Copied path {item.FullPath}");
            }
        }, () => browser.SelectedItem is not null));

        flyout.Items.Add(Item("AI Quick Edit…", () =>
        {
            if (browser.SelectedItem is { IsDirectory: false, IsParentLink: false } item)
            {
                _shell.RequestAssistQuickEdit(item.FullPath);
            }
            else
            {
                _shell.Log.Warn("AI Quick Edit works on remote text files.");
            }
        }, () => browser.SelectedItem is { IsDirectory: false, IsParentLink: false }));

        flyout.Opening += (_, _) => RefreshEnabled(flyout);
        return flyout;
    }

    public MenuFlyout BuildLocalMenu(LocalBrowserViewModel browser)
    {
        var flyout = new MenuFlyout();

        flyout.Items.Add(Item("Open", async () =>
        {
            if (browser.SelectedItem is { } item)
            {
                await browser.OpenItemCommand.ExecuteAsync(item).ConfigureAwait(true);
            }
        }, () => browser.SelectedItem is { IsDirectory: true } or { IsParentLink: true }));

        flyout.Items.Add(Item("Upload", () =>
        {
            if (browser.SelectedItem is { } item)
            {
                _shell.EnqueueSelectedUpload(item);
            }
        }, () => _shell.IsConnected && browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(new MenuFlyoutSeparator());

        flyout.Items.Add(Item("Rename…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            var name = await PromptTextAsync("Rename", "New name", item.Name).ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.RenameSelectedAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Renamed → {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("Delete…", async () =>
        {
            var item = browser.SelectedItem;
            if (item is null || item.IsParentLink)
            {
                return;
            }

            if (!await ConfirmAsync("Delete", $"Delete '{item.Name}'?").ConfigureAwait(true))
            {
                return;
            }

            try
            {
                await browser.DeleteSelectedAsync().ConfigureAwait(true);
                _shell.Log.Info($"Deleted {item.Name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }, () => browser.SelectedItem is { IsParentLink: false }));

        flyout.Items.Add(Item("New folder…", async () =>
        {
            var name = await PromptTextAsync("New folder", "Folder name", "New folder").ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.CreateDirectoryAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Created folder {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }));

        flyout.Items.Add(Item("New file…", async () =>
        {
            var name = await PromptTextAsync("New file", "File name", "new.txt").ConfigureAwait(true);
            if (name is null)
            {
                return;
            }

            try
            {
                await browser.CreateEmptyFileAsync(name).ConfigureAwait(true);
                _shell.Log.Info($"Created file {name}");
            }
            catch (Exception ex)
            {
                _shell.Log.Error(ex.Message);
            }
        }));

        flyout.Items.Add(new MenuFlyoutSeparator());

        flyout.Items.Add(Item("Copy path", () =>
        {
            if (browser.SelectedItem is { } item)
            {
                CopyText(item.FullPath);
                _shell.Log.Info($"Copied path {item.FullPath}");
            }
        }, () => browser.SelectedItem is not null));

        flyout.Opening += (_, _) => RefreshEnabled(flyout);
        return flyout;
    }

    private static MenuFlyoutItem Item(string label, Action action, Func<bool>? canExecute = null)
    {
        var item = new MenuFlyoutItem { Text = label, Tag = canExecute };
        item.Click += (_, _) => action();
        return item;
    }

    private static MenuFlyoutItem Item(string label, Func<Task> action, Func<bool>? canExecute = null)
    {
        var item = new MenuFlyoutItem { Text = label, Tag = canExecute };
        item.Click += async (_, _) =>
        {
            try
            {
                await action().ConfigureAwait(true);
            }
            catch (Exception)
            {
                // Logged by callers where relevant.
            }
        };
        return item;
    }

    private static void RefreshEnabled(MenuFlyout flyout)
    {
        foreach (var entry in flyout.Items)
        {
            if (entry is MenuFlyoutItem { Tag: Func<bool> can } item)
            {
                item.IsEnabled = can();
            }
        }
    }

    private async Task<string?> PromptTextAsync(string title, string placeholder, string initial)
    {
        var box = new TextBox
        {
            Text = initial,
            PlaceholderText = placeholder,
            MinWidth = 320
        };
        var dialog = new ContentDialog
        {
            Title = title,
            Content = box,
            PrimaryButtonText = "OK",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Primary,
            XamlRoot = _xamlRoot
        };
        ThemeHelper.ApplyToDialog(dialog);

        var result = await dialog.ShowAsync();
        if (result != ContentDialogResult.Primary)
        {
            return null;
        }

        var text = box.Text?.Trim();
        return string.IsNullOrWhiteSpace(text) ? null : text;
    }

    private async Task<bool> ConfirmAsync(string title, string message)
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = new TextBlock { Text = message, TextWrapping = TextWrapping.WrapWholeWords },
            PrimaryButtonText = "Delete",
            CloseButtonText = "Cancel",
            DefaultButton = ContentDialogButton.Close,
            XamlRoot = _xamlRoot
        };
        ThemeHelper.ApplyToDialog(dialog);
        return await dialog.ShowAsync() == ContentDialogResult.Primary;
    }

    private async Task MessageAsync(string title, string message)
    {
        var dialog = new ContentDialog
        {
            Title = title,
            Content = new TextBlock { Text = message, TextWrapping = TextWrapping.WrapWholeWords },
            CloseButtonText = "OK",
            XamlRoot = _xamlRoot
        };
        ThemeHelper.ApplyToDialog(dialog);
        await dialog.ShowAsync();
    }

    private static void CopyText(string text)
    {
        var data = new DataPackage();
        data.SetText(text);
        Clipboard.SetContent(data);
    }
}
