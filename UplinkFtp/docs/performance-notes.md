# Performance notes

## Automated (Linux CI / `dotnet test`)

| Check | Location | What it proves |
| --- | --- | --- |
| Free max 1 concurrent transfer | `tests/.../Load/TransferQueueLoadTests.cs` | Many enqueued fake downloads/uploads never exceed `ActiveCount` / FakeFtp peak of 1 |
| Pro schedules multiple | same | With delayed FakeFtp, peak concurrency &gt; 1 under Pro limits |
| Queue unit behavior | `TransferQueueServiceTests` | Pause/resume offset, directory restart policy |

These use in-process `Task.Delay` fakes — **not** real sockets, disk, or UI.

Target runtime for the load fixture: **under ~5 seconds** total.

## Still required on Windows (soak / manual)

- Large single-file transfer (GB) memory + progress UI responsiveness  
- Many small files (hundreds) against a real FTP/SFTP server  
- Pro multi-connection pool under sustained load (`ConnectionPool`)  
- UI thread health while queue is busy (WinUI)  
- Long soak (hours) for connection / handle leaks  
- Packaged (MSIX) vs unpackaged differences  

P0 Windows smoke remains **user-owned**. Automated Core tests do not replace it.

## How to run

```bash
cd UplinkFtp
dotnet test tests/UplinkFtp.Core.Tests/UplinkFtp.Core.Tests.csproj -c Release --filter "FullyQualifiedName~Load"
```
