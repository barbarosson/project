using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Transfer;

namespace UplinkFtp.Services.Transfer;

/// <summary>WinUI ContentDialog conflict Ask / apply-to-all prompt.</summary>
public sealed class UiTransferConflictPrompt : ITransferConflictPrompt
{
    private readonly DispatcherQueue _dispatcher;
    private XamlRoot? _xamlRoot;

    public UiTransferConflictPrompt()
    {
        _dispatcher = DispatcherQueue.GetForCurrentThread()
                      ?? throw new InvalidOperationException("UiTransferConflictPrompt requires a UI thread.");
    }

    public void SetXamlRoot(XamlRoot root) => _xamlRoot = root;

    public Task<TransferConflictPromptResult?> PromptAsync(
        TransferConflictPromptRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var tcs = new TaskCompletionSource<TransferConflictPromptResult?>(TaskCreationOptions.RunContinuationsAsynchronously);

        if (!_dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    if (_xamlRoot is null)
                    {
                        tcs.TrySetResult(new TransferConflictPromptResult
                        {
                            Action = request.SuggestedAction,
                            ApplyToAll = false
                        });
                        return;
                    }

                    var applyAll = new CheckBox
                    {
                        Content = "Apply to all remaining conflicts",
                        Margin = new Thickness(0, 12, 0, 0)
                    };

                    var actionBox = new ComboBox
                    {
                        ItemsSource = new[] { "Overwrite", "Skip", "If newer", "Rename", "Resume" },
                        SelectedItem = LabelFor(request.SuggestedAction),
                        HorizontalAlignment = HorizontalAlignment.Stretch,
                        Margin = new Thickness(0, 8, 0, 0)
                    };

                    var panel = new StackPanel { Spacing = 4 };
                    panel.Children.Add(new TextBlock
                    {
                        Text = $"Destination already exists:\n{request.ConflictPath}",
                        TextWrapping = TextWrapping.WrapWholeWords
                    });
                    panel.Children.Add(new TextBlock { Text = "Action", Opacity = 0.7 });
                    panel.Children.Add(actionBox);
                    panel.Children.Add(applyAll);

                    var dialog = new ContentDialog
                    {
                        Title = "Transfer conflict",
                        Content = panel,
                        PrimaryButtonText = "Continue",
                        CloseButtonText = "Skip",
                        DefaultButton = ContentDialogButton.Primary,
                        XamlRoot = _xamlRoot
                    };

                    var result = await dialog.ShowAsync();
                    if (result != ContentDialogResult.Primary)
                    {
                        tcs.TrySetResult(new TransferConflictPromptResult
                        {
                            Action = TransferConflictAction.Skip,
                            ApplyToAll = applyAll.IsChecked == true
                        });
                        return;
                    }

                    tcs.TrySetResult(new TransferConflictPromptResult
                    {
                        Action = ParseLabel(actionBox.SelectedItem as string),
                        ApplyToAll = applyAll.IsChecked == true
                    });
                }
                catch (Exception ex)
                {
                    tcs.TrySetException(ex);
                }
            }))
        {
            tcs.TrySetResult(new TransferConflictPromptResult
            {
                Action = TransferConflictAction.Skip,
                ApplyToAll = false
            });
        }

        return tcs.Task.WaitAsync(cancellationToken);
    }

    private static string LabelFor(TransferConflictAction action) => action switch
    {
        TransferConflictAction.Skip => "Skip",
        TransferConflictAction.OverwriteIfNewer => "If newer",
        TransferConflictAction.AutoRename => "Rename",
        TransferConflictAction.Resume => "Resume",
        _ => "Overwrite"
    };

    private static TransferConflictAction ParseLabel(string? label) => label switch
    {
        "Skip" => TransferConflictAction.Skip,
        "If newer" => TransferConflictAction.OverwriteIfNewer,
        "Rename" => TransferConflictAction.AutoRename,
        "Resume" => TransferConflictAction.Resume,
        _ => TransferConflictAction.Overwrite
    };
}
