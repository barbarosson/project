using UplinkFtp.ViewModels;
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
    }
}
