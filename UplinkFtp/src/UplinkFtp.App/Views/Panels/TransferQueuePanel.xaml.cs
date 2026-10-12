using UplinkFtp.ViewModels;
using Microsoft.UI.Xaml.Controls;

namespace UplinkFtp.Views.Panels;

public sealed partial class TransferQueuePanel : UserControl
{
    public TransferQueuePanel()
    {
        InitializeComponent();
    }

    public void Bind(TransferQueueViewModel queue)
    {
        DataContext = queue;
    }
}
