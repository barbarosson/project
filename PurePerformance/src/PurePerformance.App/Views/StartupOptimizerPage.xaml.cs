using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Media;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class StartupOptimizerPage : Page
{
    private StartupOptimizerViewModel? _viewModel;

    public StartupOptimizerViewModel ViewModel =>
        _viewModel ?? throw new InvalidOperationException("ViewModel not set.");

    public StartupOptimizerPage()
    {
        InitializeComponent();
        Loaded += async (_, _) =>
        {
            if (_viewModel is not null && _viewModel.Entries.Count == 0 && !_viewModel.IsBusy)
            {
                await _viewModel.RefreshCommand.ExecuteAsync(null);
            }
        };
    }

    public void SetViewModel(StartupOptimizerViewModel viewModel)
    {
        if (_viewModel is not null)
        {
            _viewModel.PropertyChanged -= OnPropertyChanged;
        }

        _viewModel = viewModel;
        viewModel.PropertyChanged += OnPropertyChanged;
        Bindings.Update();
        SyncError();
    }

    private void OnPropertyChanged(object? sender, System.ComponentModel.PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(StartupOptimizerViewModel.ErrorMessage) or null)
        {
            SyncError();
        }
    }

    private void SyncError()
    {
        var msg = _viewModel?.ErrorMessage;
        ErrorBar.IsOpen = !string.IsNullOrEmpty(msg);
        ErrorBar.Message = msg ?? string.Empty;
    }

    private async void ToggleButton_Click(object sender, RoutedEventArgs e)
    {
        if (sender is not Button { Tag: StartupEntryItem item })
        {
            return;
        }

        // Capture scroll before enable/disable refresh; restore after layout so the list
        // does not jump to the top if the collection still mutates.
        var offset = CaptureListScrollOffset();
        await ViewModel.SetEnabledCommand.ExecuteAsync(item);
        RestoreListScrollOffset(offset);
    }

    private double? CaptureListScrollOffset()
    {
        var viewer = FindDescendant<ScrollViewer>(EntriesList);
        return viewer?.VerticalOffset;
    }

    private void RestoreListScrollOffset(double? offset)
    {
        if (offset is null)
        {
            return;
        }

        // Wait for item containers to finish updating after merge/refresh.
        EntriesList.DispatcherQueue.TryEnqueue(
            Microsoft.UI.Dispatching.DispatcherQueuePriority.Low,
            () =>
            {
                var viewer = FindDescendant<ScrollViewer>(EntriesList);
                viewer?.ChangeView(null, offset, null, disableAnimation: true);
            });
    }

    private static T? FindDescendant<T>(DependencyObject root) where T : DependencyObject
    {
        var count = VisualTreeHelper.GetChildrenCount(root);
        for (var i = 0; i < count; i++)
        {
            var child = VisualTreeHelper.GetChild(root, i);
            if (child is T match)
            {
                return match;
            }

            var nested = FindDescendant<T>(child);
            if (nested is not null)
            {
                return nested;
            }
        }

        return null;
    }
}
