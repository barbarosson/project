using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using PurePerformance.Models;
using PurePerformance.ViewModels;

namespace PurePerformance.Views;

public sealed partial class ProfilesPage : Page
{
    public ProfilesViewModel ViewModel { get; private set; } = null!;
    public ProfilesPage() => InitializeComponent();
    public void SetViewModel(ProfilesViewModel vm) { ViewModel = vm; Bindings.Update(); }

    private void Activate_Click(object sender, RoutedEventArgs e)
    {
        if (ProfileList.SelectedItem is PcProfile p) ViewModel.ActivateCommand.Execute(p);
    }

    private void Remove_Click(object sender, RoutedEventArgs e)
    {
        if (ProfileList.SelectedItem is PcProfile p) ViewModel.RemoveCommand.Execute(p);
    }
}
