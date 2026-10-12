using System;
using System.Collections.Specialized;
using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Panels;

public sealed partial class LogPanel : UserControl
{
    private LogViewModel? _log;
    private MainViewModel? _shell;

    public LogPanel()
    {
        InitializeComponent();
    }

    public void Bind(LogViewModel log, MainViewModel? shell = null)
    {
        if (_log is not null)
        {
            _log.Lines.CollectionChanged -= OnLinesChanged;
        }

        _log = log;
        _shell = shell;
        DataContext = log;
        log.Lines.CollectionChanged += OnLinesChanged;
    }

    private void SolveWithAi_Click(object sender, RoutedEventArgs e)
    {
        _shell?.RequestAssistTroubleshoot();
    }

    private void OnLinesChanged(object? sender, NotifyCollectionChangedEventArgs e)
    {
        if (_log is not null && _log.Lines.Count > 0)
        {
            LogList.ScrollIntoView(_log.Lines[^1]);
        }
    }
}
