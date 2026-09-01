using WinAirPlay.App.Services;
using WinAirPlay.App.Tray;
using WinAirPlay.App.ViewModels;
using WinAirPlay.Core.Audio;
using WinAirPlay.Core.Discovery;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class MainViewModelTests
{
    private static (MainViewModel ViewModel, FakeStreamController Controller, InMemorySettingsStore Store)
        Build(AppSettings? settings = null, params AirPlayDevice[] devices)
    {
        var controller = new FakeStreamController();
        controller.ScanResult.AddRange(devices);

        var store = new InMemorySettingsStore(settings);
        var enumerator = new FakeAudioDeviceEnumerator();
        enumerator.Devices.Add(new AudioDeviceInfo("id-default", "Hoparlör", IsDefault: true));
        enumerator.Devices.Add(new AudioDeviceInfo("id-hdmi", "HDMI", IsDefault: false));

        var viewModel = new MainViewModel(controller, store, enumerator, new ImmediateDispatcher());

        return (viewModel, controller, store);
    }

    [Fact]
    public async Task ScanFillsTheDeviceListAndSelectsTheFirstOne()
    {
        var (viewModel, _, _) = Build(null, TestDevices.Create("Salon"), TestDevices.Create("Mutfak"));

        await viewModel.ScanAsync();

        Assert.Equal(2, viewModel.Devices.Count);
        Assert.Equal("Salon", viewModel.SelectedDevice?.Name);
        Assert.True(viewModel.HasDevices);
    }

    [Fact]
    public async Task RememberedDeviceIsReselectedAfterARescan()
    {
        var settings = new AppSettings { LastDeviceId = "BB:BB" };
        var (viewModel, _, _) = Build(
            settings,
            TestDevices.Create("Salon", "AA:AA"),
            TestDevices.Create("Mutfak", "BB:BB"));

        await viewModel.ScanAsync();

        Assert.Equal("Mutfak", viewModel.SelectedDevice?.Name);
    }

    [Fact]
    public async Task ConnectingMovesToStreamingAndEnablesDisconnect()
    {
        var (viewModel, _, _) = Build(null, TestDevices.Create("Salon"));
        await viewModel.ScanAsync();

        await viewModel.ConnectAsync();

        Assert.Equal(StreamState.Streaming, viewModel.State);
        Assert.True(viewModel.IsStreaming);
        Assert.True(viewModel.CanDisconnect);
        Assert.False(viewModel.CanConnect);
        Assert.Equal("Bağlantıyı Kes", viewModel.ConnectionButtonText);
    }

    [Fact]
    public async Task ConnectPassesTheCurrentSettingsToTheController()
    {
        var settings = new AppSettings { LatencyMs = 300, VolumeDb = -6, Codec = RaopStreamCodec.RawPcm };
        var (viewModel, controller, _) = Build(settings, TestDevices.Create("Salon"));
        await viewModel.ScanAsync();

        await viewModel.ConnectAsync();

        Assert.Equal(300, controller.LastSettings?.LatencyMs);
        Assert.Equal(-6, controller.LastSettings?.VolumeDb);
        Assert.Equal(RaopStreamCodec.RawPcm, controller.LastSettings?.Codec);
        Assert.True(controller.LastSettings?.MuteLocalSpeakers);
    }

    [Fact]
    public async Task ConnectWithoutASelectionDoesNothing()
    {
        var (viewModel, controller, _) = Build();

        await viewModel.ConnectAsync();

        Assert.Null(controller.LastConnectedDevice);
        Assert.Equal(StreamState.Idle, viewModel.State);
    }

    [Fact]
    public async Task ToggleDisconnectsWhileStreaming()
    {
        var (viewModel, _, _) = Build(null, TestDevices.Create("Salon"));
        await viewModel.ScanAsync();
        await viewModel.ToggleConnectionAsync();

        await viewModel.ToggleConnectionAsync();

        Assert.Equal(StreamState.Idle, viewModel.State);
        Assert.Equal("Bağlan", viewModel.ConnectionButtonText);
    }

    [Fact]
    public async Task FailedConnectionLeavesTheUserAbleToRetry()
    {
        var (viewModel, controller, _) = Build(null, TestDevices.Create("Salon"));
        controller.ConnectSucceeds = false;
        await viewModel.ScanAsync();

        await viewModel.ConnectAsync();

        Assert.Equal(StreamState.Faulted, viewModel.State);
        Assert.True(viewModel.CanConnect);
    }

    [Fact]
    public void LatencySliderRetunesTheLiveStreamAndPersists()
    {
        var (viewModel, controller, store) = Build();

        viewModel.LatencyMs = 400;

        Assert.Equal(400, viewModel.LatencyMs);
        Assert.Equal("400 ms", viewModel.LatencyText);
        Assert.Equal(new[] { 400 }, controller.LatencyUpdates);
        Assert.Equal(400, store.Current.LatencyMs);
    }

    [Theory]
    [InlineData(5000, AppSettings.MaxLatencyMs)]
    [InlineData(1, AppSettings.MinLatencyMs)]
    public void LatencySliderRefusesValuesOutsideTheSupportedRange(int input, int expected)
    {
        var (viewModel, _, _) = Build();

        viewModel.LatencyMs = input;

        Assert.Equal(expected, viewModel.LatencyMs);
    }

    [Fact]
    public void VolumeSliderIsForwardedToTheReceiver()
    {
        var (viewModel, controller, store) = Build();

        viewModel.VolumeDb = -9;

        Assert.Equal(new[] { -9d }, controller.VolumeUpdates);
        Assert.Equal(-9, store.Current.VolumeDb);
        Assert.Equal("-9 dB", viewModel.VolumeText);
    }

    [Fact]
    public void LowestVolumeReadsAsMuted()
    {
        var (viewModel, _, _) = Build();

        viewModel.VolumeDb = AppSettings.MinVolumeDb;

        Assert.Equal("kısık", viewModel.VolumeText);
    }

    [Fact]
    public void CodecToggleSwitchesBetweenAlacAndPcm()
    {
        var (viewModel, _, store) = Build();

        Assert.True(viewModel.UseAlac);

        viewModel.UseAlac = false;

        Assert.Equal(RaopStreamCodec.RawPcm, store.Current.Codec);
        Assert.Contains("PCM", viewModel.CodecHint);
    }

    [Fact]
    public void StartupPreferencesArePersisted()
    {
        var (viewModel, _, store) = Build();

        viewModel.AutoConnect = true;
        viewModel.StartMinimized = true;
        viewModel.MuteLocalSpeakers = false;

        Assert.True(store.Current.AutoConnect);
        Assert.True(store.Current.StartMinimized);
        Assert.False(store.Current.MuteLocalSpeakers);
    }

    [Fact]
    public async Task AutoConnectStreamsToTheRememberedDeviceOnStartup()
    {
        var settings = new AppSettings { AutoConnect = true, LastDeviceId = "BB:BB" };
        var (viewModel, controller, _) = Build(
            settings,
            TestDevices.Create("Salon", "AA:AA"),
            TestDevices.Create("Mutfak", "BB:BB"));

        await viewModel.InitializeAsync();

        Assert.Equal("Mutfak", controller.LastConnectedDevice?.Name);
        Assert.Equal(StreamState.Streaming, viewModel.State);
    }

    [Fact]
    public async Task StartupWithoutAutoConnectOnlyScans()
    {
        var (viewModel, controller, _) = Build(null, TestDevices.Create("Salon"));

        await viewModel.InitializeAsync();

        Assert.Equal(1, controller.ScanCount);
        Assert.Null(controller.LastConnectedDevice);
    }

    [Fact]
    public void StatisticsOnlyRefreshWhileStreaming()
    {
        var (viewModel, controller, _) = Build();
        controller.Statistics = new StreamStatistics(
            TimeSpan.FromSeconds(90), 1000, 2048, 5, 3, TimeSpan.FromMilliseconds(50),
            new PcmLevel(0.5f, 0.25f), RaopStreamCodec.AppleLossless, false, "Hoparlör");

        viewModel.RefreshStatistics();

        Assert.Equal("00:00", viewModel.PositionText);
        Assert.Equal(0, viewModel.PeakLeft);
    }

    [Fact]
    public async Task StatisticsAreProjectedIntoTheBindings()
    {
        var (viewModel, controller, _) = Build(null, TestDevices.Create("Salon"));
        await viewModel.ScanAsync();
        await viewModel.ConnectAsync();

        controller.Statistics = new StreamStatistics(
            TimeSpan.FromSeconds(3661), 1234, 4096, 7, 2, TimeSpan.FromMilliseconds(50),
            new PcmLevel(0.5f, 0.25f), RaopStreamCodec.AppleLossless, IsEncrypted: true, "Hoparlör");

        viewModel.RefreshStatistics();

        Assert.Equal("01:01:01", viewModel.PositionText);
        Assert.Contains("1.234 paket", viewModel.PacketText.Replace(',', '.'));
        Assert.Contains("şifreli", viewModel.CodecText);
        Assert.Equal(0.5f, viewModel.PeakLeft);
        Assert.Equal(0.25f, viewModel.PeakRight);
    }

    [Fact]
    public async Task DisconnectingClearsTheStatisticsPanel()
    {
        var (viewModel, controller, _) = Build(null, TestDevices.Create("Salon"));
        await viewModel.ScanAsync();
        await viewModel.ConnectAsync();

        controller.Statistics = new StreamStatistics(
            TimeSpan.FromSeconds(30), 500, 1024, 3, 1, TimeSpan.FromMilliseconds(50),
            new PcmLevel(0.8f, 0.8f), RaopStreamCodec.AppleLossless, false, "Hoparlör");
        viewModel.RefreshStatistics();

        await viewModel.DisconnectAsync();

        Assert.Equal(0, viewModel.PeakLeft);
        Assert.Equal("-", viewModel.PacketText);
    }

    [Fact]
    public void StatusMessagesFromTheControllerReachTheUi()
    {
        var (viewModel, controller, _) = Build();

        _ = controller.ScanAsync(TimeSpan.Zero);

        Assert.Equal("0 cihaz bulundu.", viewModel.StatusText);
    }
}

public class ReselectTests
{
    [Fact]
    public void EmptyResultClearsTheSelection() =>
        Assert.Null(MainViewModel.Reselect(Array.Empty<AirPlayDevice>(), null, "AA", "Salon"));

    [Fact]
    public void HardwareIdWinsOverName()
    {
        var devices = new[]
        {
            TestDevices.Create("Salon", "AA:AA"),
            TestDevices.Create("Yeni İsim", "BB:BB"),
        };

        var result = MainViewModel.Reselect(devices, null, "BB:BB", "Salon");

        Assert.Equal("Yeni İsim", result?.Name);
    }

    [Fact]
    public void NameIsUsedWhenTheDeviceReportsNoHardwareId()
    {
        var devices = new[] { TestDevices.Create("Salon"), TestDevices.Create("Mutfak") };

        var result = MainViewModel.Reselect(devices, null, null, "Mutfak");

        Assert.Equal("Mutfak", result?.Name);
    }

    [Fact]
    public void CurrentSelectionTakesPrecedenceOverTheStoredOne()
    {
        var devices = new[]
        {
            TestDevices.Create("Salon", "AA:AA"),
            TestDevices.Create("Mutfak", "BB:BB"),
        };

        var result = MainViewModel.Reselect(devices, devices[1], "AA:AA", "Salon");

        Assert.Equal("Mutfak", result?.Name);
    }

    [Fact]
    public void UnknownSelectionFallsBackToTheFirstDevice()
    {
        var devices = new[] { TestDevices.Create("Salon", "AA:AA") };

        var result = MainViewModel.Reselect(devices, null, "ZZ:ZZ", "Yok");

        Assert.Equal("Salon", result?.Name);
    }
}

public class TrayIconHostTests
{
    [Fact]
    public void ShortTooltipsPassThroughUnchanged() =>
        Assert.Equal("WinAirPlay", TrayIconHost.Truncate("WinAirPlay", 63));

    [Fact]
    public void LongTooltipsAreCutToTheWin32Limit()
    {
        var result = TrayIconHost.Truncate(new string('x', 200), 63);

        Assert.Equal(63, result.Length);
        Assert.EndsWith("…", result);
    }
}

public class BitrateEstimatorTests
{
    [Fact]
    public void FirstSampleOnlyEstablishesABaseline()
    {
        var estimator = new BitrateEstimator();

        Assert.Equal(0, estimator.Update(1000, TimeSpan.Zero));
    }

    [Fact]
    public void SteadyThroughputConvergesOnTheRealRate()
    {
        var estimator = new BitrateEstimator();
        estimator.Update(0, TimeSpan.Zero);

        // 176 400 bytes per second is CD-quality stereo PCM, i.e. ~1411 kbit/s.
        for (var second = 1; second <= 40; second++)
        {
            estimator.Update(176_400L * second, TimeSpan.FromSeconds(second));
        }

        Assert.InRange(estimator.KilobitsPerSecond, 1400, 1420);
    }

    [Fact]
    public void CounterResetStartsANewBaselineInsteadOfSpiking()
    {
        var estimator = new BitrateEstimator();
        estimator.Update(100_000, TimeSpan.FromSeconds(1));
        estimator.Update(200_000, TimeSpan.FromSeconds(2));
        var before = estimator.KilobitsPerSecond;

        estimator.Update(0, TimeSpan.Zero);

        Assert.Equal(before, estimator.KilobitsPerSecond);
    }

    [Fact]
    public void ResetClearsTheReading()
    {
        var estimator = new BitrateEstimator();
        estimator.Update(0, TimeSpan.Zero);
        estimator.Update(176_400, TimeSpan.FromSeconds(1));

        estimator.Reset();

        Assert.Equal(0, estimator.KilobitsPerSecond);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-0.5)]
    [InlineData(1.5)]
    public void InvalidSmoothingIsRejected(double smoothing) =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new BitrateEstimator(smoothing));
}
