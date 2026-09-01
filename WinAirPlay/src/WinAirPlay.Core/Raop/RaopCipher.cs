using System.Security.Cryptography;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// The per-session AES key that protects the audio payload, plus the RSA-wrapped copy of it that
/// travels in the ANNOUNCE body.
/// </summary>
public sealed class RaopEncryptionKeys
{
    /// <summary>
    /// The RSA public key every AirPlay receiver ships with. Senders wrap the AES key with it so
    /// only the receiver can unwrap it; the matching private key lives on the device.
    /// </summary>
    private const string AirPortModulusBase64 =
        "59dE8qLieItsH1WgjrcFRKj6eUWqi+bGLOX1HL3U3GhC/j0Qg90u3sG/1CUtwC5vOYvfDmFI6oSFXi5ELabWJmT2" +
        "dKHzBJKa3k9ok+8t9ucRqMd6DZHJ2YCCLlDRKSKv6kDqnw4UwPdpOMXziC/AMj3Z/lUVX1G7WSHCAWKf1zNS1eLv" +
        "qr+boEjXuBOitnZ/bDzPHrTOZz0Dew0uowxf/+sG+NCK3eQJVxqcaJ/vEHKIVd2M+5qL71yJQ+87X6oV3eaYvt3z" +
        "WZYD6z5vYTcrtij2VZ9Zmni/UAaHqn9JdsBWLUEpVviYnhimNVvYFZeCXg/IdTQ+x4IRdiXNv5hEew==";

    private const string AirPortExponentBase64 = "AQAB";

    private RaopEncryptionKeys(byte[] key, byte[] iv)
    {
        Key = key;
        Iv = iv;
        WrappedKeyBase64 = ToRaopBase64(WrapKey(key));
        IvBase64 = ToRaopBase64(iv);
    }

    public byte[] Key { get; }

    public byte[] Iv { get; }

    /// <summary>Value of the SDP <c>a=rsaaeskey</c> attribute.</summary>
    public string WrappedKeyBase64 { get; }

    /// <summary>Value of the SDP <c>a=aesiv</c> attribute.</summary>
    public string IvBase64 { get; }

    public static RaopEncryptionKeys Create() =>
        new(RandomNumberGenerator.GetBytes(16), RandomNumberGenerator.GetBytes(16));

    internal static RaopEncryptionKeys FromExisting(byte[] key, byte[] iv) => new(key, iv);

    private static byte[] WrapKey(byte[] key)
    {
        using var rsa = RSA.Create();
        rsa.ImportParameters(new RSAParameters
        {
            Modulus = Convert.FromBase64String(AirPortModulusBase64),
            Exponent = Convert.FromBase64String(AirPortExponentBase64),
        });

        return rsa.Encrypt(key, RSAEncryptionPadding.OaepSHA1);
    }

    /// <summary>RAOP carries base64 without the padding characters.</summary>
    private static string ToRaopBase64(byte[] value) => Convert.ToBase64String(value).TrimEnd('=');
}

/// <summary>
/// Encrypts an audio payload the way RAOP expects: AES-128-CBC over the whole 16-byte blocks
/// only, with the trailing partial block left in the clear and the IV reset for every packet.
/// </summary>
public sealed class RaopPacketCipher : IDisposable
{
    private readonly Aes _aes;
    private readonly byte[] _iv;

    public RaopPacketCipher(RaopEncryptionKeys keys)
    {
        ArgumentNullException.ThrowIfNull(keys);

        _iv = keys.Iv;
        _aes = Aes.Create();
        _aes.Key = keys.Key;
        _aes.Mode = CipherMode.CBC;
        _aes.Padding = PaddingMode.None;
    }

    public int Encrypt(ReadOnlySpan<byte> payload, Span<byte> destination)
    {
        if (destination.Length < payload.Length)
        {
            throw new ArgumentException("Hedef tampon yükten küçük olamaz.", nameof(destination));
        }

        var blockBytes = payload.Length & ~15;

        if (blockBytes > 0)
        {
            _aes.EncryptCbc(payload[..blockBytes], _iv, destination[..blockBytes], PaddingMode.None);
        }

        payload[blockBytes..].CopyTo(destination[blockBytes..]);

        return payload.Length;
    }

    public void Dispose() => _aes.Dispose();
}
