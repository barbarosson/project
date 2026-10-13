using UplinkFtp.Services.Ai;
using UplinkFtp.Services.Security;
using UplinkFtp.Services.Settings;

namespace UplinkFtp.Core.Tests;

public sealed class AiAssistantServiceTests
{
    [Fact]
    public void Redaction_ScrubsPasswordAssignments()
    {
        var line = AiPromptRedaction.RedactLine("auth password=supersecret user=barba");
        Assert.DoesNotContain("supersecret", line, StringComparison.Ordinal);
        Assert.Contains("[REDACTED]", line, StringComparison.Ordinal);
    }

    [Fact]
    public async Task LocalTroubleshoot_PermissionDenied_ReturnsSteps()
    {
        var ai = CreateLocal();
        var result = await ai.TroubleshootAsync(new AiTroubleshootRequest
        {
            LogLines =
            [
                "Connecting to 127.0.0.1:22 via Sftp...",
                "ERROR: Authentication failed. Check username, password, or SFTP private key."
            ],
            Protocol = "SFTP",
            Host = "127.0.0.1"
        });

        Assert.False(result.UsedCloudModel);
        Assert.NotEmpty(result.Advice);
        Assert.NotEmpty(result.Steps);
    }

    [Fact]
    public async Task ParseSearch_BackupZipHeuristics()
    {
        var ai = CreateLocal();
        var filter = await ai.ParseSearchQueryAsync(
            "Geçen hafta yüklenen ve içinde 'backup' geçen 50MB'tan büyük ZIP dosyalarını bul");

        Assert.Equal(".zip", filter.Extension);
        Assert.Equal("backup", filter.NameContains);
        Assert.Equal(50L * 1024 * 1024, filter.MinSizeBytes);
        Assert.NotNull(filter.ModifiedAfterUtc);
    }

    [Fact]
    public async Task HasApiKey_FalseUntilStored()
    {
        var store = new MemoryCredentialStore();
        var settings = new AppSettings();
        var ai = new LocalAiAssistantService(store, settings);
        Assert.False(await ai.HasApiKeyAsync());

        await store.SaveSecretAsync(AiCredentialKeys.ApiKeyResource, AiCredentialKeys.ApiKeyUserName, "sk-test");
        Assert.True(await ai.HasApiKeyAsync());
    }

    [Fact]
    public async Task BatchRename_PreviewStripsDateAndAddsV2()
    {
        var ai = CreateLocal();
        var preview = await ai.PreviewBatchRenameAsync(
            ["report-2024-01-15.txt", "notes.txt"],
            "Tüm dosyaların adındaki tarihi sil ve sonuna '-v2' ekle");

        Assert.Contains(preview.Items, i => i.OldName == "report-2024-01-15.txt" && i.NewName == "report-v2.txt");
    }

    private static LocalAiAssistantService CreateLocal()
        => new(new MemoryCredentialStore(), new AppSettings());
}
