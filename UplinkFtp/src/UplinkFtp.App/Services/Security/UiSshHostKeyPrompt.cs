using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.UI.Dispatching;
using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using UplinkFtp.Services.Security;

namespace UplinkFtp.Services.Security;

/// <summary>WinUI first-connect / mismatch host-key confirmation.</summary>
public sealed class UiSshHostKeyPrompt : ISshHostKeyPrompt
{
    private readonly DispatcherQueue _dispatcher;
    private XamlRoot? _xamlRoot;

    public UiSshHostKeyPrompt()
    {
        _dispatcher = DispatcherQueue.GetForCurrentThread()
                      ?? throw new InvalidOperationException("UiSshHostKeyPrompt requires a UI thread.");
    }

    public void SetXamlRoot(XamlRoot root) => _xamlRoot = root;

    public Task<SshHostKeyPromptResult> PromptAsync(
        SshHostKeyPromptRequest request,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        var tcs = new TaskCompletionSource<SshHostKeyPromptResult>(TaskCreationOptions.RunContinuationsAsynchronously);

        if (!_dispatcher.TryEnqueue(async () =>
            {
                try
                {
                    if (_xamlRoot is null)
                    {
                        tcs.TrySetResult(new SshHostKeyPromptResult { Decision = SshHostKeyDecision.Reject });
                        return;
                    }

                    var display = SshHostKeyVerifier.FormatFingerprintDisplay(request.FingerprintSha256);
                    var title = request.Kind == SshHostKeyPromptKind.Mismatch
                        ? "SFTP host key changed"
                        : "Trust SFTP host key?";
                    var body = request.Kind == SshHostKeyPromptKind.Mismatch
                        ? $"The host key for {request.Host}:{request.Port} does not match the pinned fingerprint.\n\n" +
                          $"Offered SHA-256:\n{display}\n\nPreviously pinned:\n" +
                          SshHostKeyVerifier.FormatFingerprintDisplay(request.PreviousFingerprintSha256 ?? "")
                        : $"First connection to {request.Host}:{request.Port}" +
                          (string.IsNullOrWhiteSpace(request.KeyType) ? "" : $" ({request.KeyType})") +
                          $".\n\nSHA-256 fingerprint:\n{display}\n\nPin only if you trust this server.";

                    var dialog = new ContentDialog
                    {
                        Title = title,
                        Content = new TextBlock
                        {
                            Text = body,
                            TextWrapping = TextWrapping.WrapWholeWords,
                            IsTextSelectionEnabled = true
                        },
                        PrimaryButtonText = "Pin and trust",
                        SecondaryButtonText = "Accept once",
                        CloseButtonText = "Reject",
                        DefaultButton = ContentDialogButton.Primary,
                        XamlRoot = _xamlRoot
                    };

                    var result = await dialog.ShowAsync();
                    var decision = result switch
                    {
                        ContentDialogResult.Primary => SshHostKeyDecision.PinAndTrust,
                        ContentDialogResult.Secondary => SshHostKeyDecision.AcceptOnce,
                        _ => SshHostKeyDecision.Reject
                    };
                    tcs.TrySetResult(new SshHostKeyPromptResult { Decision = decision });
                }
                catch (Exception ex)
                {
                    tcs.TrySetException(ex);
                }
            }))
        {
            tcs.TrySetResult(new SshHostKeyPromptResult { Decision = SshHostKeyDecision.Reject });
        }

        return tcs.Task.WaitAsync(cancellationToken);
    }
}
