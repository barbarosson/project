using FtpAi.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using Windows.ApplicationModel.DataTransfer;

namespace FtpAi.Views.Panels;

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

    private void FileList_DragOver(object sender, DragEventArgs e)
    {
        e.AcceptedOperation = DataPackageOperation.Copy;
        e.DragUIOverride.Caption = "Upload here";
        e.DragUIOverride.IsCaptionVisible = true;
    }

    private async void FileList_Drop(object sender, DragEventArgs e)
    {
        if (_shell is null || !e.DataView.Contains(StandardDataFormats.Text))
        {
            return;
        }

        var text = await e.DataView.GetTextAsync();
        await _shell.HandleDropOnRemoteAsync(text);
    }
}
