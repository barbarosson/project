using System;
using UplinkFtp.Helpers;
using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.ApplicationModel.DataTransfer;

namespace UplinkFtp.Views.Panels;

public sealed partial class LocalBrowserPanel : UserControl
{
    private MainViewModel? _shell;
    private LocalBrowserViewModel? _browser;

    public LocalBrowserPanel()
    {
        InitializeComponent();
    }

    public void Bind(LocalBrowserViewModel browser, MainViewModel shell)
    {
        _browser = browser;
        _shell = shell;
        DataContext = browser;
        Loaded += OnLoadedOnce;
    }

    private void OnLoadedOnce(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoadedOnce;
        if (_shell is null || _browser is null || XamlRoot is null)
        {
            return;
        }

        var menus = new BrowserContextMenuManager(_shell, XamlRoot);
        FileList.ContextFlyout = menus.BuildLocalMenu(_browser);
    }

    private void PathBox_KeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && _browser is not null)
        {
            _ = _browser.RefreshCommand.ExecuteAsync(null);
        }
    }

    private void FolderTree_ItemInvoked(TreeView sender, TreeViewItemInvokedEventArgs args)
    {
        if (_browser is null || args.InvokedItem is not LocalFolderNodeViewModel node)
        {
            return;
        }

        _ = _browser.NavigateTreeNodeAsync(node);
    }

    private void FolderTree_Expanding(TreeView sender, TreeViewExpandingEventArgs args)
    {
        if (_browser is null || args.Item is not LocalFolderNodeViewModel node)
        {
            return;
        }

        _ = _browser.EnsureTreeNodeChildrenAsync(node);
    }

    private void FileList_DoubleTapped(object sender, DoubleTappedRoutedEventArgs e)
    {
        if (_browser is not null && FileList.SelectedItem is BrowserItemViewModel item)
        {
            _ = _browser.OpenItemCommand.ExecuteAsync(item);
        }
    }

    private void FileList_RightTapped(object sender, RightTappedRoutedEventArgs e)
    {
        if (e.OriginalSource is FrameworkElement { DataContext: BrowserItemViewModel item }
            && _browser is not null)
        {
            _browser.SelectedItem = item;
        }
    }

    private void UploadSelected_Click(object sender, RoutedEventArgs e)
    {
        if (_shell is null || _browser?.SelectedItem is null)
        {
            return;
        }

        _shell.EnqueueSelectedUpload(_browser.SelectedItem);
    }

    private void AiSearchBox_KeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && _browser is not null)
        {
            var text = sender is TextBox box ? box.Text : AiSearchBox.Text;
            _ = _browser.ApplySearchFromUiAsync(text);
            e.Handled = true;
        }
    }

    private void FilterButton_Click(object sender, RoutedEventArgs e)
    {
        if (_browser is null)
        {
            return;
        }

        _ = _browser.ApplySearchFromUiAsync(AiSearchBox.Text);
    }

    private void FileList_DragItemsStarting(object sender, DragItemsStartingEventArgs e)
    {
        if (e.Items.Count == 0 || e.Items[0] is not BrowserItemViewModel item || item.IsParentLink)
        {
            e.Cancel = true;
            return;
        }

        e.Data.SetText(MainViewModel.CreateDragText(item, "Local"));
        e.Data.RequestedOperation = DataPackageOperation.Copy;
    }

    private void DropTarget_DragOver(object sender, DragEventArgs e)
    {
        if (e.DataView.Contains(StandardDataFormats.Text))
        {
            e.AcceptedOperation = DataPackageOperation.Copy;
            e.DragUIOverride.Caption = "Download here";
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

        // WinUI cancels async Drop work unless a deferral is held until await completes.
        var deferral = e.GetDeferral();
        try
        {
            if (!e.DataView.Contains(StandardDataFormats.Text))
            {
                return;
            }

            var text = await e.DataView.GetTextAsync();
            await _shell.HandleDropOnLocalAsync(text);
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
