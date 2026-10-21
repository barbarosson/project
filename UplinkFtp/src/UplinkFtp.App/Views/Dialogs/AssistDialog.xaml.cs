using System;
using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Dialogs;

public sealed partial class AssistDialog : ContentDialog
{
    public AssistViewModel ViewModel { get; }

    public AssistDialog(AssistViewModel viewModel)
    {
        ViewModel = viewModel;
        DataContext = viewModel;
        InitializeComponent();
        Resources["ContentDialogMinWidth"] = 580.0;
        Resources["ContentDialogMaxWidth"] = 680.0;
    }

    /// <summary>
    /// Pin each tab panel to the ScrollViewer viewport so muted captions wrap
    /// (same pattern as SettingsDialog).
    /// </summary>
    private void AssistScroll_SizeChanged(object sender, SizeChangedEventArgs e)
    {
        if (sender is not ScrollViewer scroll || e.NewSize.Width <= 0)
        {
            return;
        }

        var width = Math.Max(300, e.NewSize.Width - 8);
        if (scroll.Content is FrameworkElement panel)
        {
            panel.Width = width;
            panel.MaxWidth = width;
        }
    }
}
