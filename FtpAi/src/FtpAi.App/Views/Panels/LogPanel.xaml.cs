using System.Collections.Specialized;
using FtpAi.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace FtpAi.Views.Panels;

public sealed partial class LogPanel : UserControl
{
    private LogViewModel? _log;

    public LogPanel()
    {
        InitializeComponent();
    }

    public void Bind(LogViewModel log)
    {
        if (_log is not null)
        {
            _log.Lines.CollectionChanged -= OnLinesChanged;
        }

        _log = log;
        DataContext = log;
        log.Lines.CollectionChanged += OnLinesChanged;
    }

    private void OnLinesChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (_log is not null && _log.Lines.Count > 0)
        {
            LogList.ScrollIntoView(_log.Lines[^1]);
        }
    }
}
