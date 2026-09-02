namespace WinAirPlay.Core.Audio;

/// <summary>
/// Applies a Windows endpoint volume scalar to 16-bit little-endian PCM so process-loopback
/// (which is captured before device volume) still follows the system volume keys.
/// </summary>
public static class PcmVolume
{
    public static void ApplyScalar(Span<byte> pcm16LittleEndian, float scalar)
    {
        if (pcm16LittleEndian.Length < 2)
        {
            return;
        }

        if (float.IsNaN(scalar) || float.IsInfinity(scalar))
        {
            scalar = 1f;
        }

        scalar = Math.Clamp(scalar, 0f, 1f);

        if (Math.Abs(scalar - 1f) < 0.0005f)
        {
            return;
        }

        if (scalar <= 0f)
        {
            pcm16LittleEndian.Clear();
            return;
        }

        for (var i = 0; i + 1 < pcm16LittleEndian.Length; i += 2)
        {
            var sample = (short)(pcm16LittleEndian[i] | (pcm16LittleEndian[i + 1] << 8));
            var scaled = (int)Math.Round(sample * (double)scalar);
            scaled = Math.Clamp(scaled, short.MinValue, short.MaxValue);
            pcm16LittleEndian[i] = (byte)scaled;
            pcm16LittleEndian[i + 1] = (byte)(scaled >> 8);
        }
    }
}
