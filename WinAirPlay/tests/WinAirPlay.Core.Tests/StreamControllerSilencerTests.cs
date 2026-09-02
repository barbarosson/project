using WinAirPlay.App.Localization;
using WinAirPlay.App.Services;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class StreamControllerSilencerTests
{
    [Fact]
    public void RestoreLocalSpeakers_UnmutesThroughTheInjectedSilencer()
    {
        var silencer = new RecordingSilencer();
        var controller = new StreamController(
            new FakeAirPlayDiscovery(),
            new LocalizationService(),
            silencer: silencer);

        controller.RestoreLocalSpeakers();

        Assert.Equal(1, silencer.RestoreCount);
    }

    [Fact]
    public void RestoreLocalSpeakers_IsIdempotentWhenTheSilencerThrows()
    {
        var silencer = new ThrowingSilencer();
        var controller = new StreamController(
            new FakeAirPlayDiscovery(),
            new LocalizationService(),
            silencer: silencer);

        controller.RestoreLocalSpeakers();
        controller.RestoreLocalSpeakers();
    }
}

internal sealed class RecordingSilencer : ILocalOutputSilencer
{
    public int RestoreCount { get; private set; }

    public bool IsSilenced { get; private set; }

    public void Silence(string? deviceId) => IsSilenced = true;

    public void Restore()
    {
        RestoreCount++;
        IsSilenced = false;
    }

    public void Dispose() => Restore();
}

internal sealed class ThrowingSilencer : ILocalOutputSilencer
{
    public bool IsSilenced => false;

    public void Silence(string? deviceId)
    {
    }

    public void Restore() => throw new InvalidOperationException("unmute failed");

    public void Dispose()
    {
    }
}

internal sealed class FakeAirPlayDiscovery : IAirPlayDiscovery
{
    public event EventHandler<MdnsServiceRecord>? ServiceObserved;

    public Task<IReadOnlyList<AirPlayDevice>> ScanAsync(
        TimeSpan duration,
        CancellationToken cancellationToken = default) =>
        Task.FromResult<IReadOnlyList<AirPlayDevice>>(Array.Empty<AirPlayDevice>());
}
