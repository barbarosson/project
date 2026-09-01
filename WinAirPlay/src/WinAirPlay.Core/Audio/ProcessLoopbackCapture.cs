using System.Runtime.InteropServices;
using NAudio.Wave;

namespace WinAirPlay.Core.Audio;

/// <summary>
/// Captures every process's render stream <em>before</em> it hits an endpoint. Muting the speakers
/// therefore silences the room without starving AirPlay, which WASAPI device-loopback cannot do.
/// Requires Windows 10 2004 or later.
/// </summary>
internal sealed class ProcessLoopbackCapture : IWaveIn
{
    private const string ProcessLoopbackEndpoint = @"VAD\Process_Loopback";
    private static readonly Guid AudioClientIid = new("1CB9AD4C-DBFA-4C32-B178-C2F568A703B2");
    private static readonly Guid AudioCaptureClientIid = new("C8ADBD64-E71E-48A0-A4DE-185C395CD317");

    private readonly Thread _thread;
    private readonly ManualResetEventSlim _ready = new(false);
    private readonly ManualResetEventSlim _start = new(false);
    private readonly ManualResetEventSlim _finished = new(false);

    private Exception? _initError;
    private volatile bool _recording;
    private volatile bool _stopRequested;
    private byte[] _recordBuffer = Array.Empty<byte>();

    public ProcessLoopbackCapture()
    {
        _thread = new Thread(Run)
        {
            IsBackground = true,
            Name = "WinAirPlay.ProcessLoopback",
            Priority = ThreadPriority.AboveNormal,
        };
        _thread.SetApartmentState(ApartmentState.MTA);
        _thread.Start();

        if (!_ready.Wait(TimeSpan.FromSeconds(8)))
        {
            _stopRequested = true;
            _start.Set();
            throw new TimeoutException("Windows işlem loopback yakalamasını zamanında başlatamadı.");
        }

        if (_initError is not null)
        {
            throw _initError;
        }
    }

    public WaveFormat WaveFormat { get; set; } = WaveFormat.CreateIeeeFloatWaveFormat(48000, 2);

    public event EventHandler<WaveInEventArgs>? DataAvailable;

    public event EventHandler<StoppedEventArgs>? RecordingStopped;

    public void StartRecording()
    {
        if (_recording)
        {
            return;
        }

        _recording = true;
        _start.Set();
    }

    public void StopRecording()
    {
        _recording = false;
        _stopRequested = true;
        _start.Set();
        _finished.Wait(TimeSpan.FromSeconds(2));
        RecordingStopped?.Invoke(this, new StoppedEventArgs());
    }

    public void Dispose()
    {
        StopRecording();
        _ready.Dispose();
        _start.Dispose();
        _finished.Dispose();
    }

    private void Run()
    {
        NativeAudioClient? client = null;
        NativeAudioCaptureClient? capture = null;

        try
        {
            // Process loopback's IAudioClient does not implement GetMixFormat (E_NOTIMPL).
            // Microsoft's sample initialises a PCM format and lets WASAPI convert.
            WaveFormat = new WaveFormat(44100, 16, 2);
            var formatPtr = AllocPcmWaveFormatEx(WaveFormat);
            try
            {
                var session = ActivateClient(formatPtr);
                client = session.Client;
                capture = session.Capture;
            }
            finally
            {
                Marshal.FreeHGlobal(formatPtr);
            }

            Marshal.ThrowExceptionForHR(client.GetBufferSize(out var bufferFrames));
            _recordBuffer = new byte[Math.Max(1, (int)bufferFrames) * WaveFormat.BlockAlign];

            _ready.Set();
            _start.Wait();

            if (_stopRequested)
            {
                return;
            }

            Marshal.ThrowExceptionForHR(client.Start());
            Pump(capture);
            client.Stop();
        }
        catch (Exception ex)
        {
            _initError = new InvalidOperationException(
                $"İşlem loopback başlatılamadı (0x{ex.HResult:X8}): {ex.Message}", ex);
            _ready.Set();
            RecordingStopped?.Invoke(this, new StoppedEventArgs(_initError));
        }
        finally
        {
            if (capture is not null)
            {
                Marshal.ReleaseComObject(capture);
            }

            if (client is not null)
            {
                Marshal.ReleaseComObject(client);
            }

            _finished.Set();
        }
    }

    private void Pump(NativeAudioCaptureClient capture)
    {
        var blockAlign = WaveFormat.BlockAlign;

        while (_recording && !_stopRequested)
        {
            Marshal.ThrowExceptionForHR(capture.GetNextPacketSize(out var framesInNext));
            if (framesInNext == 0)
            {
                Thread.Sleep(5);
                continue;
            }

            while (framesInNext != 0 && _recording)
            {
                Marshal.ThrowExceptionForHR(capture.GetBuffer(
                    out var pointer, out var frames, out var flags, out _, out _));

                var bytes = (int)frames * blockAlign;
                if (bytes > 0)
                {
                    if (bytes > _recordBuffer.Length)
                    {
                        _recordBuffer = new byte[bytes];
                    }

                    const uint Silent = 0x2;
                    if ((flags & Silent) != 0 || pointer == IntPtr.Zero)
                    {
                        Array.Clear(_recordBuffer, 0, bytes);
                    }
                    else
                    {
                        Marshal.Copy(pointer, _recordBuffer, 0, bytes);
                    }

                    DataAvailable?.Invoke(this, new WaveInEventArgs(_recordBuffer, bytes));
                }

                Marshal.ThrowExceptionForHR(capture.ReleaseBuffer(frames));
                Marshal.ThrowExceptionForHR(capture.GetNextPacketSize(out framesInNext));
            }
        }
    }

    private static IntPtr AllocPcmWaveFormatEx(WaveFormat format)
    {
        var pointer = Marshal.AllocHGlobal(18);
        Marshal.WriteInt16(pointer, 0, 1);
        Marshal.WriteInt16(pointer, 2, (short)format.Channels);
        Marshal.WriteInt32(pointer, 4, format.SampleRate);
        Marshal.WriteInt32(pointer, 8, format.AverageBytesPerSecond);
        Marshal.WriteInt16(pointer, 12, (short)format.BlockAlign);
        Marshal.WriteInt16(pointer, 14, (short)format.BitsPerSample);
        Marshal.WriteInt16(pointer, 16, 0);
        return pointer;
    }

    private static ActivatedSession ActivateClient(IntPtr formatPtr)
    {
        var activation = new AudioClientActivationParams
        {
            ActivationType = 1,
            TargetProcessId = (uint)Environment.ProcessId,
            ProcessLoopbackMode = 1,
        };

        var blobSize = Marshal.SizeOf<AudioClientActivationParams>();
        var blob = Marshal.AllocHGlobal(blobSize);
        var propPtr = Marshal.AllocHGlobal(24);

        try
        {
            Marshal.StructureToPtr(activation, blob, false);

            var prop = new PropVariant64
            {
                vt = (ushort)VarEnum.VT_BLOB,
                blobSize = blobSize,
                blobData = blob,
            };
            Marshal.StructureToPtr(prop, propPtr, false);

            var handler = new ActivateCompletionHandler(formatPtr);
            var iid = AudioClientIid;
            var hr = NativeMethods.ActivateAudioInterfaceAsync(
                ProcessLoopbackEndpoint,
                ref iid,
                propPtr,
                handler,
                out var operation);
            Marshal.ThrowExceptionForHR(hr);
            GC.KeepAlive(operation);

            return handler.WaitForSession();
        }
        finally
        {
            Marshal.FreeHGlobal(propPtr);
            Marshal.FreeHGlobal(blob);
        }
    }
}

internal readonly record struct ActivatedSession(NativeAudioClient Client, NativeAudioCaptureClient Capture);

[StructLayout(LayoutKind.Sequential)]
internal struct AudioClientActivationParams
{
    public int ActivationType;
    public uint TargetProcessId;
    public int ProcessLoopbackMode;
}

[StructLayout(LayoutKind.Explicit, Size = 24)]
internal struct PropVariant64
{
    [FieldOffset(0)] public ushort vt;
    [FieldOffset(8)] public int blobSize;
    [FieldOffset(16)] public IntPtr blobData;
}

[ComImport]
[Guid("1CB9AD4C-DBFA-4C32-B178-C2F568A703B2")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface NativeAudioClient
{
    [PreserveSig] int Initialize(int shareMode, int streamFlags, long bufferDuration, long periodicity, IntPtr format, IntPtr sessionGuid);
    [PreserveSig] int GetBufferSize(out uint bufferSize);
    [PreserveSig] int GetStreamLatency(out long latency);
    [PreserveSig] int GetCurrentPadding(out uint padding);
    [PreserveSig] int IsFormatSupported(int shareMode, [In] WaveFormat format, out IntPtr closestMatch);
    [PreserveSig] int GetMixFormat(out IntPtr deviceFormat);
    [PreserveSig] int GetDevicePeriod(out long defaultPeriod, out long minimumPeriod);
    [PreserveSig] int Start();
    [PreserveSig] int Stop();
    [PreserveSig] int Reset();
    [PreserveSig] int SetEventHandle(IntPtr eventHandle);
    [PreserveSig] int GetService(ref Guid interfaceId, [MarshalAs(UnmanagedType.IUnknown)] out object service);
}

[ComImport]
[Guid("C8ADBD64-E71E-48A0-A4DE-185C395CD317")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface NativeAudioCaptureClient
{
    [PreserveSig] int GetBuffer(out IntPtr data, out uint frames, out uint flags, out ulong devicePosition, out ulong qpcPosition);
    [PreserveSig] int ReleaseBuffer(uint framesRead);
    [PreserveSig] int GetNextPacketSize(out uint frames);
}

[ComImport]
[Guid("41D949AB-9862-444A-80F6-C261334DA5EB")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IActivateAudioInterfaceCompletionHandler
{
    [PreserveSig]
    int ActivateCompleted(IActivateAudioInterfaceAsyncOperation activateOperation);
}

[ComImport]
[Guid("72A22D78-CDE4-431D-B8CC-843A71199B6D")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IActivateAudioInterfaceAsyncOperation
{
    [PreserveSig]
    int GetActivateResult(out int activateResult, out IntPtr activatedInterface);
}

[ComImport]
[Guid("94EA2B94-E9CC-49E0-C0FF-EE64CA8F5B90")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IAgileObject;

internal sealed class ActivateCompletionHandler : IActivateAudioInterfaceCompletionHandler, IAgileObject
{
    private const int StreamFlagsLoopback = 0x00020000;
    private const int StreamFlagsAutoconvertPcm = unchecked((int)0x80000000);

    private static readonly Guid CaptureClientIid = new("C8ADBD64-E71E-48A0-A4DE-185C395CD317");

    private readonly IntPtr _formatPtr;
    private readonly ManualResetEventSlim _done = new(false);
    private int _resultHr = unchecked((int)0x80004005);
    private NativeAudioClient? _client;
    private NativeAudioCaptureClient? _capture;
    private Exception? _error;

    public ActivateCompletionHandler(IntPtr formatPtr) => _formatPtr = formatPtr;

    public int ActivateCompleted(IActivateAudioInterfaceAsyncOperation activateOperation)
    {
        try
        {
            var callHr = activateOperation.GetActivateResult(out var activateResult, out var unknown);
            _resultHr = callHr < 0 ? callHr : activateResult;
            Marshal.ThrowExceptionForHR(_resultHr);

            if (unknown == IntPtr.Zero)
            {
                throw new InvalidOperationException("ActivateAudioInterfaceAsync IAudioClient döndürmedi.");
            }

            _client = (NativeAudioClient)Marshal.GetObjectForIUnknown(unknown);
            Marshal.Release(unknown);

            // Same flags Microsoft's ApplicationLoopback sample uses, minus EVENTCALLBACK
            // because we drain packets on a dedicated thread instead of an MMCSS wait.
            Marshal.ThrowExceptionForHR(_client.Initialize(
                0,
                StreamFlagsLoopback | StreamFlagsAutoconvertPcm,
                200_000,
                0,
                _formatPtr,
                IntPtr.Zero));

            var captureIid = CaptureClientIid;
            Marshal.ThrowExceptionForHR(_client.GetService(ref captureIid, out var service));
            _capture = (NativeAudioCaptureClient)service;
        }
        catch (Exception ex)
        {
            _error = ex;
        }
        finally
        {
            _done.Set();
        }

        return 0;
    }

    public ActivatedSession WaitForSession()
    {
        if (!_done.Wait(TimeSpan.FromSeconds(5)))
        {
            throw new TimeoutException("Windows işlem loopback yakalamasını zamanında başlatamadı.");
        }

        if (_error is not null)
        {
            throw _error;
        }

        Marshal.ThrowExceptionForHR(_resultHr);

        return new ActivatedSession(
            _client ?? throw new InvalidOperationException("IAudioClient yok."),
            _capture ?? throw new InvalidOperationException("IAudioCaptureClient yok."));
    }
}

internal static class NativeMethods
{
    [DllImport("Mmdevapi.dll", ExactSpelling = true, PreserveSig = true)]
    public static extern int ActivateAudioInterfaceAsync(
        [MarshalAs(UnmanagedType.LPWStr)] string deviceInterfacePath,
        ref Guid riid,
        IntPtr activationParams,
        IActivateAudioInterfaceCompletionHandler completionHandler,
        out IActivateAudioInterfaceAsyncOperation activationOperation);
}
