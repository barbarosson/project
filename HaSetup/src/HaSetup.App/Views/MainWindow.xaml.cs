using System.Windows;
using HaSetup.App.ViewModels;

namespace HaSetup.App.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        var vm = new MainViewModel();
        DataContext = vm;
        Loaded += async (_, _) => await vm.InitializeAsync().ConfigureAwait(true);
    }
}
