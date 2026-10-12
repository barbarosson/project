using System;
using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.ApplicationModel.DataTransfer;

namespace UplinkFtp.Views.Panels;

public sealed partial class RemoteBrowserPanel : UserControl
{
    private MainViewModel? _shell;
    private RemoteBrowserViewModel? _browser;

    public RemoteBrowserPanel()
    {
        InitializeComponent();
    }

    public void Bind(RemoteBrowserViewModel browser, MainViewModel shell)
    {
        _browser = browser;
        _shell = shell;
        DataContext = browser;
    }

    private void PathBox_KeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && _browser is not null)
        {
            _ = _browser.RefreshCommand.ExecuteAsync(null);
        }
    }

    private void FileList_DoubleTapped(object sender, DoubleTappedRoutedEventArgs e)
    {
        if (_browser is not null && FileList.SelectedItem is BrowserItemViewModel item)
        {
            _ = _browser.OpenItemCommand.ExecuteAsync(item);
        }
    }

    private void DownloadSelected_Click(object sender, RoutedEventArgs e)
    {
        if (_shell is null || _browser?.SelectedItem is null)
        {
            return;
        }

        _shell.EnqueueSelectedDownload(_browser.SelectedItem);
    }

    private void QuickEditSelected_Click(object sender, RoutedEventArgs e)
        => RequestQuickEdit();

    private void QuickEditMenu_Click(object sender, RoutedEventArgs e)
        => RequestQuickEdit();

    private void FileList_RightTapped(object sender, RightTappedRoutedEventArgs e)
    {
        if (e.OriginalSource is FrameworkElement { DataContext: BrowserItemViewModel item })
        {
            if (_browser is not null)
            {
                _browser.SelectedItem = item;
            }
        }
    }

    private void AiSearchBox_KeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && _browser is not null)
        {
            _ = _browser.ApplyAiSearchCommand.ExecuteAsync(null);
        }
    }

    private void RequestQuickEdit()
    {
        if (_shell is null || _browser?.SelectedItem is null)
        {
            return;
        }

        var item = _browser.SelectedItem;
        if (item.IsDirectory || item.IsParentLink)
        {
            _shell.Log.Warn("AI Quick Edit works on remote text files.");
            return;
        }

        _shell.RequestAssistQuickEdit(item.FullPath);
    }

    private void FileList_DragItemsStarting(object sender, DragItemsStartingEventArgs e)
    {
        if (e.Items.Count == 0 || e.Items[0] is not BrowserItemViewModel item || item.IsParentLink)
        {
            e.Cancel = true;
            return;
        }

        e.Data.SetText(MainViewModel.CreateDragText(item, "Remote"));
        e.Data.RequestedOperation = DataPackageOperation.Copy;
    }

    private void DropTarget_DragOver(object sender, DragEventArgs e)
    {
        if (e.DataView.Contains(StandardDataFormats.Text))
        {
            e.AcceptedOperation = DataPackageOperation.Copy;
            e.DragUIOverride.Caption = "Upload here";
            e.DragUIOverride.IsCaptionVisible = true;
            e.DragUIOverride.IsGlyphVisible = true;
        }
        else
        {
            e.AcceptedOperation = DataPackageOperation.None;
        }

        e.Handled = true;
    }

    private async void DropTarget_Drop(object sender, DragEventArgs e)
    {
        if (_shell is null)
        {
            return;
        }

        var deferral = e.GetDeferral();
        try
        {
            if (!e.DataView.Contains(StandardDataFormats.Text))
            {
                return;
            }

            var text = await e.DataView.GetTextAsync();
            await _shell.HandleDropOnRemoteAsync(text);
            e.AcceptedOperation = DataPackageOperation.Copy;
            e.Handled = true;
        }
        catch (Exception ex)
        {
            _shell.Log.Error($"Drop failed: {ex.Message}");
        }
        finally
        {
            deferral.Complete();
        }
    }
}
