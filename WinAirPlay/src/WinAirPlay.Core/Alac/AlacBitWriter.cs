namespace WinAirPlay.Core.Alac;

/// <summary>
/// Writes an ALAC frame bit by bit, most significant bit first. The frame header is 23 bits long,
/// so the sample data that follows is never byte aligned and has to be shifted into place.
/// </summary>
public ref struct AlacBitWriter
{
    private readonly Span<byte> _buffer;
    private int _bitPosition;

    public AlacBitWriter(Span<byte> buffer, int startBit = 0)
    {
        _buffer = buffer;
        _bitPosition = startBit;

        if (startBit == 0)
        {
            buffer.Clear();
        }
    }

    public readonly int BitLength => _bitPosition;

    public readonly int ByteLength => (_bitPosition + 7) / 8;

    public void Write(uint value, int bitCount)
    {
        if (bitCount is < 1 or > 32)
        {
            throw new ArgumentOutOfRangeException(nameof(bitCount), bitCount, "Can write 1-32 bits.");
        }

        EnsureCapacity(bitCount);

        for (var shift = bitCount - 1; shift >= 0; shift--)
        {
            if (((value >> shift) & 1) != 0)
            {
                _buffer[_bitPosition >> 3] |= (byte)(0x80 >> (_bitPosition & 7));
            }

            _bitPosition++;
        }
    }

    /// <summary>Byte-at-a-time fast path; a per-bit loop would cost millions of iterations a second.</summary>
    public void WriteByte(byte value)
    {
        EnsureCapacity(8);

        var index = _bitPosition >> 3;
        var offset = _bitPosition & 7;

        if (offset == 0)
        {
            _buffer[index] = value;
        }
        else
        {
            _buffer[index] |= (byte)(value >> offset);
            _buffer[index + 1] = (byte)(value << (8 - offset));
        }

        _bitPosition += 8;
    }

    /// <summary>Writes a little-endian PCM sample as big-endian ALAC bits.</summary>
    public void WriteSample16(ReadOnlySpan<byte> sample)
    {
        WriteByte((byte)(sample[1]));
        WriteByte(sample[0]);
    }

    private readonly void EnsureCapacity(int bitCount)
    {
        if (_bitPosition + bitCount > _buffer.Length * 8)
        {
            throw new InvalidOperationException(
                $"ALAC tamponu yetersiz: {_buffer.Length} bayt, {_bitPosition + bitCount} bit gerekiyor.");
        }
    }
}
