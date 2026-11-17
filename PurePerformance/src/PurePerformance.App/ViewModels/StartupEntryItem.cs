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

    public StartupEntry Entry { get; private set; }

    public string Id => Entry.Id;

    public string Name => Entry.Name;

    public string Command => Entry.Command;

    public string LocationLabel => Entry.LocationLabel;

    public bool RequiresAdmin => Entry.RequiresAdmin;

    /// <summary>Stable key across enable/disable (Id flips on|off).</summary>
    public string StableKey => MakeStableKey(Entry.Location, Entry.Name);

    public static string MakeStableKey(StartupLocation location, string name) =>
        $"{location}|{name}";

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(StatusText))]
    [NotifyPropertyChangedFor(nameof(ActionLabel))]
    private bool isEnabled;

    [ObservableProperty]
    private string? lastMessage;

    public string StatusText => IsEnabled ? "Currently enabled" : "Currently disabled";

    public string ActionLabel => IsEnabled ? "Disable" : "Enable";

    /// <summary>
    /// Updates this row from a freshly enumerated entry without replacing the object,
    /// so ListView / CollectionView keep scroll position and item containers.
    /// </summary>
    public void Apply(StartupEntry entry)
    {
        Entry = entry;
        IsEnabled = entry.IsEnabled;
        OnPropertyChanged(nameof(Id));
        OnPropertyChanged(nameof(Name));
        OnPropertyChanged(nameof(Command));
        OnPropertyChanged(nameof(LocationLabel));
        OnPropertyChanged(nameof(RequiresAdmin));
        OnPropertyChanged(nameof(StableKey));
    }
}
