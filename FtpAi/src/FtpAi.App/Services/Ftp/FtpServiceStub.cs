using System.Threading;
using System.Threading.Tasks;

namespace FtpAi.Services.Ftp;

/// <summary>ADIM 1 placeholder so DI compiles before protocol work begins.</summary>
public sealed class FtpServiceStub : IFtpService
{
    public string Name => "FtpServiceStub";

    public bool IsConnected => false;

    public Task ConnectAsync(CancellationToken cancellationToken = default)
        => Task.CompletedTask;

    public Task DisconnectAsync(CancellationToken cancellationToken = default)
        => Task.CompletedTask;
}
