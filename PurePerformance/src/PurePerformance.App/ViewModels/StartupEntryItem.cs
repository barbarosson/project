using CommunityToolkit.Mvvm.ComponentModel;
using PurePerformance.Models;

namespace PurePerformance.ViewModels;

public partial class StartupEntryItem : ObservableObject
{
    public StartupEntryItem(StartupEntry entry)
    {
        Entry = entry;
        IsEnabled = entry.IsEnabled;
    }

    public StartupEntry Entry { get; }

    public string Id => Entry.Id;

    public string Name => Entry.Name;

    public string Command => Entry.Command;

    public string LocationLabel => Entry.LocationLabel;

    public bool RequiresAdmin => Entry.RequiresAdmin;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(StatusText))]
    [NotifyPropertyChangedFor(nameof(ActionLabel))]
    private bool isEnabled;

    [ObservableProperty]
    private string? lastMessage;

    public string StatusText => IsEnabled ? "Currently enabled" : "Currently disabled";

    public string ActionLabel => IsEnabled ? "Disable" : "Enable";
}
