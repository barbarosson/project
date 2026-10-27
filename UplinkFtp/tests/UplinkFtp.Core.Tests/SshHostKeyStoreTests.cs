using System.Text;
using UplinkFtp.Services.Security;

namespace UplinkFtp.Core.Tests;

public sealed class SshHostKeyStoreTests
{
    [Fact]
    public async Task Pin_and_Get_roundtrip()
    {
        var path = Path.Combine(Path.GetTempPath(), "uplink-hostkeys-" + Guid.NewGuid().ToString("N") + ".json");
        try
        {
            var store = new JsonSshHostKeyStore(path);
            await store.PinAsync("sftp.example.test", 22, "AABBCCDDEEFF00112233445566778899aabbccddeeff00112233445566778899", "ssh-ed25519");
            var pinned = await store.GetPinnedFingerprintAsync("sftp.example.test", 22);
            Assert.NotNull(pinned);
            Assert.True(JsonSshHostKeyStore.FingerprintsMatch(
                pinned!,
                "aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99:aa:bb:cc:dd:ee:ff:00:11:22:33:44:55:66:77:88:99"));
        }
        finally
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }

    [Fact]
    public async Task Verifier_auto_pins_on_first_connect_without_prompt()
    {
        var path = Path.Combine(Path.GetTempPath(), "uplink-hostkeys-" + Guid.NewGuid().ToString("N") + ".json");
        try
        {
            var store = new JsonSshHostKeyStore(path);
            var verifier = new SshHostKeyVerifier(store, prompt: null);
            var keyBytes = Encoding.UTF8.GetBytes("fake-host-key-material");
            Assert.True(await verifier.EvaluateAsync("host.test", 22, keyBytes, "ssh-rsa"));
            var fp = SshHostKeyVerifier.ToSha256Hex(keyBytes);
            var pinned = await store.GetPinnedFingerprintAsync("host.test", 22);
            Assert.True(JsonSshHostKeyStore.FingerprintsMatch(pinned!, fp));
        }
        finally
        {
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }
    }

    [Fact]
    public async Task Verifier_rejects_mismatch_without_prompt()
    {
        var path = Path.Combine(Path.GetTempPath(), "uplink-hostkeys-" + Guid.NewGuid().ToString("N") + ".json");
        try
        {
            var store = new JsonSshHostKeyStore(path);
            await store.PinAsync("host.test", 22, SshHostKeyVerifier.ToSha256Hex(Encoding.UTF8.GetBytes("old-key")));
            var verifier = new SshHostKeyVerifier(store, prompt: null);
            Assert.False(await verifier.EvaluateAsync("host.test", 22, Encoding.UTF8.GetBytes("new-key"), "ssh-rsa"));
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
