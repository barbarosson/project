using UplinkFtp.Models.Enums;
using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Core.Tests;

public sealed class AppSettingsStoreTests
{
    [Fact]
    public async Task Save_then_Load_roundtrips_non_secret_settings()
    {
        var path = Path.Combine(Path.GetTempPath(), "uplink-settings-" + Guid.NewGuid().ToString("N") + ".json");
        try
        {
            var store = new JsonAppSettingsStore(path);
            var source = new AppSettings
            {
                Theme = "ZEN",
                AcceptAnyCertificate = true,
                UsePassive = false,
                TelemetryOptIn = true,
                AiProvider = AiProviderKind.Gemini,
                AiModel = "gemini-2.0-flash",
                DefaultConflictAction = TransferConflictAction.Ask,
                SynchronizedBrowsing = true,
                ConnectTimeout = TimeSpan.FromSeconds(12),
                RetryCount = 5
            };

            await store.SaveAsync(source);

            var loaded = new AppSettings();
            await store.LoadIntoAsync(loaded);

            Assert.Equal("ZEN", loaded.Theme);
            Assert.True(loaded.AcceptAnyCertificate);
            Assert.False(loaded.UsePassive);
            Assert.True(loaded.TelemetryOptIn);
            Assert.Equal(AiProviderKind.Gemini, loaded.AiProvider);
            Assert.Equal("gemini-2.0-flash", loaded.AiModel);
            Assert.Equal(TransferConflictAction.Ask, loaded.DefaultConflictAction);
            Assert.True(loaded.SynchronizedBrowsing);
            Assert.Equal(12, loaded.ConnectTimeout.TotalSeconds);
            Assert.Equal(5, loaded.RetryCount);
        }
        finally
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }
}
