using WinAirPlay.App.Localization;
using WinAirPlay.App.Services;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class LocalizationServiceTests
{
    [Fact]
    public void Turkish_IsTheDefaultLanguage()
    {
        var localization = new LocalizationService();

        Assert.Equal(AppLanguage.Tr, localization.Language);
        Assert.Equal("Bağlan", localization.Get(LocKeys.Connect));
    }

    [Fact]
    public void English_ReturnsTranslatedStrings()
    {
        var localization = new LocalizationService { Language = AppLanguage.En };

        Assert.Equal("Connect", localization.Get(LocKeys.Connect));
        Assert.Equal("Scan", localization.Get(LocKeys.Scan));
        Assert.Equal("BUFFER (LATENCY)", localization.Get(LocKeys.BufferLatency));
        Assert.Equal("Found {0} device(s).", localization.Get(LocKeys.DevicesFound));
    }

    [Fact]
    public void LanguageChange_RaisesAnEvent()
    {
        var localization = new LocalizationService();
        var raised = false;
        localization.LanguageChanged += (_, _) => raised = true;

        localization.Language = AppLanguage.En;

        Assert.True(raised);
    }

    [Fact]
    public void AppSettings_PersistsLanguage()
    {
        var store = new InMemorySettingsStore(new AppSettings { Language = AppLanguage.En });

        var loaded = store.Load().Normalize();

        Assert.Equal(AppLanguage.En, loaded.Language);
    }
}
