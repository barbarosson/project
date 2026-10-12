using System;
using System.Collections.ObjectModel;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace UplinkFtp.ViewModels;

public sealed partial class LogViewModel : ObservableObject
{
    private const int MaxLines = 500;

    public ObservableCollection<string> Lines { get; } = [];

    public void Info(string message) => Append("INFO", message);

    public void Warn(string message) => Append("WARN", message);

    public void Error(string message) => Append("ERROR", message);

    [RelayCommand]
    private void Clear() => Lines.Clear();

    private void Append(string level, string message)
    {
        var line = $"{DateTime.Now:HH:mm:ss} [{level}] {message}";
        Lines.Add(line);
        while (Lines.Count > MaxLines)
        {
            Lines.RemoveAt(0);
        }
    }
}
