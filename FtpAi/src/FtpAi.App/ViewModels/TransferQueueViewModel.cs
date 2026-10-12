using System;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;

namespace FtpAi.ViewModels;

/// <summary>
/// ADIM 4 placeholder queue — shows active/finished DnD transfers.
/// Full multi-threaded queue manager arrives in ADIM 5.
/// </summary>
public sealed partial class TransferQueueViewModel : ObservableObject
{
    public ObservableCollection<TransferQueueItemViewModel> Items { get; } = [];

    public TransferQueueItemViewModel Enqueue(string direction, string source, string destination)
    {
        var item = new TransferQueueItemViewModel
        {
            Direction = direction,
            Source = source,
            Destination = destination,
            Status = "Running",
            StartedAt = DateTime.Now
        };
        Items.Insert(0, item);
        return item;
    }
}

public sealed partial class TransferQueueItemViewModel : ObservableObject
{
    public string Direction { get; init; } = string.Empty;

    public string Source { get; init; } = string.Empty;

    public string Destination { get; init; } = string.Empty;

    public DateTime StartedAt { get; init; }

    [ObservableProperty]
    private string _status = "Queued";

    [ObservableProperty]
    private string _detail = string.Empty;
}
