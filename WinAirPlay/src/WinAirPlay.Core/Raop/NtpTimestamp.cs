using System.Buffers.Binary;

namespace WinAirPlay.Core.Raop;

/// <summary>
/// 64-bit NTP timestamps: 32 bits of seconds since 1900-01-01 followed by a 32-bit fraction.
/// AirPlay uses these for every timing and control packet.
/// </summary>
public static class NtpTimestamp
{
    public static readonly DateTime Epoch = new(1900, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private const double FractionScale = 4294967296.0;

    public static ulong FromTimeSpanSinceEpoch(TimeSpan sinceEpoch)
    {
        var totalSeconds = sinceEpoch.TotalSeconds;
        if (totalSeconds < 0)
        {
            return 0;
        }

        var seconds = (ulong)totalSeconds;
        var fraction = (ulong)((totalSeconds - seconds) * FractionScale);

        return (seconds << 32) | (fraction & 0xFFFFFFFF);
    }

    public static TimeSpan ToTimeSpanSinceEpoch(ulong timestamp)
    {
        var seconds = timestamp >> 32;
        var fraction = timestamp & 0xFFFFFFFF;

        return TimeSpan.FromSeconds(seconds + (fraction / FractionScale));
    }

    public static ulong FromUtc(DateTime utc) => FromTimeSpanSinceEpoch(utc - Epoch);

    public static void WriteBigEndian(Span<byte> destination, ulong timestamp) =>
        BinaryPrimitives.WriteUInt64BigEndian(destination, timestamp);

    public static ulong ReadBigEndian(ReadOnlySpan<byte> source) =>
        BinaryPrimitives.ReadUInt64BigEndian(source);
}
