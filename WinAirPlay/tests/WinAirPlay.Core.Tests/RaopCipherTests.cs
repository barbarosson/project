using System.Security.Cryptography;
using WinAirPlay.Core.Raop;
using Xunit;

namespace WinAirPlay.Core.Tests;

public class RaopEncryptionKeysTests
{
    [Fact]
    public void Create_ProducesA128BitKeyAndIv()
    {
        var keys = RaopEncryptionKeys.Create();

        Assert.Equal(16, keys.Key.Length);
        Assert.Equal(16, keys.Iv.Length);
    }

    [Fact]
    public void WrappedKey_IsRsa2048AndCarriesNoBase64Padding()
    {
        var keys = RaopEncryptionKeys.Create();

        Assert.DoesNotContain('=', keys.WrappedKeyBase64);
        Assert.Equal(256, Convert.FromBase64String(Pad(keys.WrappedKeyBase64)).Length);
    }

    [Fact]
    public void IvBase64_RoundTripsToTheRawIv()
    {
        var keys = RaopEncryptionKeys.Create();

        Assert.Equal(keys.Iv, Convert.FromBase64String(Pad(keys.IvBase64)));
    }

    [Fact]
    public void WrappingIsRandomised_SoTwoSessionsNeverShareACiphertext()
    {
        var first = RaopEncryptionKeys.Create();
        var second = RaopEncryptionKeys.Create();

        Assert.NotEqual(first.WrappedKeyBase64, second.WrappedKeyBase64);
    }

    private static string Pad(string value) => value.PadRight((value.Length + 3) / 4 * 4, '=');
}

public class RaopPacketCipherTests
{
    private static readonly RaopEncryptionKeys Keys = RaopEncryptionKeys.Create();

    [Fact]
    public void PayloadLengthIsPreserved()
    {
        using var cipher = new RaopPacketCipher(Keys);
        var destination = new byte[1412];

        Assert.Equal(1412, cipher.Encrypt(new byte[1412], destination));
    }

    [Fact]
    public void TrailingPartialBlockStaysInTheClear()
    {
        using var cipher = new RaopPacketCipher(Keys);

        // 1412 = 88 whole blocks + 4 leftover bytes.
        var payload = new byte[1412];
        RandomNumberGenerator.Fill(payload);

        var destination = new byte[payload.Length];
        cipher.Encrypt(payload, destination);

        Assert.Equal(payload[1408..], destination[1408..]);
        Assert.NotEqual(payload[..1408], destination[..1408]);
    }

    [Fact]
    public void IvIsResetPerPacketSoIdenticalInputEncryptsIdentically()
    {
        using var cipher = new RaopPacketCipher(Keys);

        var payload = new byte[32];
        RandomNumberGenerator.Fill(payload);

        var first = new byte[32];
        var second = new byte[32];
        cipher.Encrypt(payload, first);
        cipher.Encrypt(payload, second);

        Assert.Equal(first, second);
    }

    [Fact]
    public void CiphertextDecryptsBackWithTheAnnouncedKey()
    {
        using var cipher = new RaopPacketCipher(Keys);

        var payload = new byte[64];
        RandomNumberGenerator.Fill(payload);

        var encrypted = new byte[payload.Length];
        cipher.Encrypt(payload, encrypted);

        using var aes = Aes.Create();
        aes.Key = Keys.Key;

        var decrypted = aes.DecryptCbc(encrypted, Keys.Iv, PaddingMode.None);

        Assert.Equal(payload, decrypted);
    }

    [Fact]
    public void PayloadShorterThanOneBlock_IsLeftAlone()
    {
        using var cipher = new RaopPacketCipher(Keys);

        var payload = new byte[] { 1, 2, 3 };
        var destination = new byte[3];
        cipher.Encrypt(payload, destination);

        Assert.Equal(payload, destination);
    }

    [Fact]
    public void UndersizedDestination_Throws()
    {
        using var cipher = new RaopPacketCipher(Keys);

        Assert.Throws<ArgumentException>(() => cipher.Encrypt(new byte[32], new byte[16]));
    }
}
