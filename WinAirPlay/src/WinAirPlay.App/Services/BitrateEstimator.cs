using System;

namespace WinAirPlay.App.Services;

/// <summary>
/// Turns a running byte counter into a smoothed throughput reading. The UI samples a few times a
/// second, which is too noisy to show raw, so successive rates are blended.
/// </summary>
public sealed class BitrateEstimator
{
    private readonly double _smoothing;

    private long _lastBytes;
    private TimeSpan _lastAt;
    private bool _hasSample;

    /// <param name="smoothing">0 keeps the previous reading, 1 uses only the newest one.</param>
    public BitrateEstimator(double smoothing = 0.3)
    {
        if (smoothing is <= 0 or > 1)
        {
            throw new ArgumentOutOfRangeException(nameof(smoothing), smoothing, "Must be between 0 and 1.");
        }

        _smoothing = smoothing;
    }

    public double KilobitsPerSecond { get; private set; }

    public void Reset()
    {
        _hasSample = false;
        _lastBytes = 0;
        _lastAt = TimeSpan.Zero;
        KilobitsPerSecond = 0;
    }

    public double Update(long totalBytes, TimeSpan timestamp)
    {
        // A counter that went backwards means a new session; start over rather than report a spike.
        if (!_hasSample || totalBytes < _lastBytes || timestamp < _lastAt)
        {
            _hasSample = true;
            _lastBytes = totalBytes;
            _lastAt = timestamp;
            return KilobitsPerSecond;
        }

        var elapsed = (timestamp - _lastAt).TotalSeconds;
        if (elapsed <= 0)
        {
            return KilobitsPerSecond;
        }

        var instant = (totalBytes - _lastBytes) * 8 / 1000.0 / elapsed;

        _lastBytes = totalBytes;
        _lastAt = timestamp;
        KilobitsPerSecond = KilobitsPerSecond <= 0
            ? instant
            : (KilobitsPerSecond * (1 - _smoothing)) + (instant * _smoothing);

        return KilobitsPerSecond;
    }
}
