# WinAirPlay

Windows sistem sesini (WASAPI loopback) yakalayıp yerel ağdaki bir AirPlay alıcısına
(HomePod mini) gerçek zamanlı aktaran masaüstü uygulaması.

## Yol Haritası

| Faz | Kapsam | Durum |
| --- | --- | --- |
| 1 | Çekirdek ses yakalama (WASAPI loopback → 44.1 kHz / 16-bit / stereo PCM) | Tamam |
| 2 | mDNS ile AirPlay cihaz keşfi (`_raop._tcp`, `_airplay._tcp`) | Tamam |
| 3 | RTSP el sıkışması (ANNOUNCE / SETUP / RECORD) | Tamam |
| 4.1 | Şifresiz ham PCM (L16) RTP/UDP yayını + zamanlama | Tamam |
| 4.2 | ALAC kodlama ve AES şifreleme | Tamam |
| 5 | WPF + System Tray arayüzü (MVVM) | Checkpoint bekliyor |

## Proje Yapısı

```
WinAirPlay/
├── src/
│   ├── WinAirPlay.Core/     Ses motoru (arayüz tabanlı, UI'dan bağımsız)
│   ├── WinAirPlay.Cli/      Faz doğrulamaları için konsol uygulaması
│   └── WinAirPlay.App/      WPF masaüstü uygulaması (MVVM + sistem tepsisi)
└── tests/
    └── WinAirPlay.Core.Tests/
```

`WinAirPlay.Core` sadece arayüzler üzerinden konuşur, böylece sonraki fazlarda WAV yazıcı
yerine AirPlay göndericisi takılabilir ve testlerde donanım/ağ mock'lanabilir.

`Audio/` — ses motoru:

- `IAudioCaptureSource` — PCM blok üreticisi (`WasapiLoopbackCaptureSource`)
- `IAudioSink` — PCM blok tüketicisi (`WaveFileAudioSink`, ileride `AirPlayRtpSink`)
- `AudioPipeline` — kaynağı sink'lere bağlar, sayaç ve seviye ölçümü tutar
- `IAudioDeviceEnumerator` — yakalanabilir çıkış cihazları (`WasapiDeviceEnumerator`)

`Discovery/` — ağ keşfi:

- `IAirPlayDiscovery` — mDNS taraması (`ZeroconfAirPlayDiscovery`)
- `MdnsServiceRecord` — Zeroconf'tan bağımsız ham servis kaydı
- `RaopTxtRecordParser` — TXT kayıtları → `RaopCapabilities` (kodek, şifreleme, format)
- `AirPlayDeviceCatalog` — `_raop` + `_airplay` kayıtlarını tek `AirPlayDevice`'ta birleştirir
- `AirPlayDeviceSelector` — sıra no / isim / IP / donanım kimliği ile cihaz seçimi

`Rtsp/` — protokol taşıması:

- `RtspClient` — kalıcı TCP bağlantısı, CSeq yönetimi, `Traced` olayıyla tam diyalog dökümü
- `RtspMessageParser` — durum satırı, katlanmış başlıklar, `Transport` parametreleri

`Raop/` — AirPlay oturumu:

- `RaopHandshake` — OPTIONS → ANNOUNCE → SETUP → RECORD akışı
- `SdpBuilder` — ANNOUNCE gövdesindeki ALAC tanımı
- `RaopTimingResponder` — cihazın NTP saat sorgularını yanıtlar (SETUP bunu bekler)
- `RaopSession` — anlaşılan portlar, oturum kimliği, ses seviyesi ve TEARDOWN
- `RaopMediaFormat` — codec seçimi (L16 ham PCM / ALAC) ve RTP payload tipi
- `IRaopPayloadEncoder` — PCM bloğunu RTP yüküne çevirir; `PcmPassthroughEncoder` ve
  `AlacUncompressedEncoder` uygulamaları var
- `RaopEncryptionKeys` / `RaopPacketCipher` — AES-128-CBC yük şifrelemesi ve anahtarın
  Apple'ın açık RSA anahtarıyla sarmalanması
- `RaopRtpSender` — `IAudioSink` olarak blokları kodlayıp RTP'ye sarar ve UDP ile gönderir,
  arka planda periyodik sync paketleriyle saati sabitler

## Gereksinimler

- .NET 8 SDK (`winget install --id Microsoft.DotNet.SDK.8 -e`)
- Windows 10/11
- NuGet: `NAudio.Core` 2.2.1, `NAudio.Wasapi` 2.2.1, `Zeroconf` 3.7.16

## Kullanım (Faz 1)

```powershell
dotnet build

# Yakalanabilir ses çıkış cihazlarını listele
dotnet run --project src\WinAirPlay.Cli -- list

# Sistem sesini yakala; Enter'a basınca durur
dotnet run --project src\WinAirPlay.Cli -- capture

# 20 saniye kaydet, belirli bir dosyaya yaz
dotnet run --project src\WinAirPlay.Cli -- capture -s 20 -o test_capture.wav
```

Seçenekler:

| Seçenek | Açıklama |
| --- | --- |
| `-o, --out <yol>` | Çıktı dosyası (varsayılan `test_capture.wav`, solution klasörüne yazılır) |
| `-s, --seconds <n>` | n saniye sonra otomatik dur |
| `-d, --device <id>` | Belirli bir çıkış cihazını yakala |
| `--silence` | Hiçbir şey çalmazken sessizlik bloklarıyla akışı sürdür |

WASAPI loopback sessizken hiç veri üretmez; kayıt sırasında bilgisayarda bir şey çalıyor
olmalıdır. Faz 4'teki canlı yayın için `--silence` davranışı varsayılan hâle gelecek.

## Kullanım (Faz 2)

```powershell
# Ağdaki AirPlay cihazlarını ara (varsayılan 10 saniye)
dotnet run --project src\WinAirPlay.Cli -- scan

# Daha uzun tara ve tüm TXT kayıtlarını dök
dotnet run --project src\WinAirPlay.Cli -- scan -s 15 -v
```

Cihaz bulunamazsa: bilgisayar ile HomePod aynı Wi-Fi ağında olmalı, ağ profili "Özel"
seçilmeli ve güvenlik duvarı UDP 5353 (mDNS) trafiğine izin vermelidir.

## Kullanım (Faz 3)

```powershell
# Tara, listeden seç, RTSP el sıkışmasını yap
dotnet run --project src\WinAirPlay.Cli -- connect

# Hedefi doğrudan ver: sıra no, isim, IP veya donanım kimliği
dotnet run --project src\WinAirPlay.Cli -- connect -t 192.168.0.121
```

Tüm RTSP trafiği konsola dökülür: giden istekler `>>`, gelen yanıtlar `<<` ile işaretlenir.
Başarılı bir el sıkışmadan sonra cihazın ayırdığı ses / kontrol / zamanlama portları
listelenir; Faz 4 bu portlara RTP gönderecek.

## Kullanım (Faz 4)

```powershell
# Sistem sesini seçilen cihaza canlı aktar (varsayılan: ALAC, şifresiz, 50 ms tampon)
dotnet run --project src\WinAirPlay.Cli -- stream

# Hedefi ver, 30 saniye yayınla, RTSP diyaloğunu da göster
dotnet run --project src\WinAirPlay.Cli -- stream -t 192.168.0.121 -s 30 -v

# Ham PCM'e (Faz 4.1 yolu) dön
dotnet run --project src\WinAirPlay.Cli -- stream --codec pcm

# Kesilme olursa tamponu büyüt
dotnet run --project src\WinAirPlay.Cli -- stream --latency 500

# Hoparlörü açık bırak (varsayılan: yayın boyunca susturulur)
dotnet run --project src\WinAirPlay.Cli -- stream --keep-speakers
```

Yayın başladığında yerel hoparlör susturulur; ses yalnızca AirPlay cihazından gelir.
Kopunca hoparlör eski haline döner. WASAPI cihaz-loopback mute ile birlikte sessiz
kalacağı için yakalama, Windows 10 2004+'daki işlem loopback API'si ile hoparlörden
*önce* yapılır.

### Kodlama hakkında

ALAC çerçeveleri biçimin "sıkıştırılmamış" kipiyle üretilir: bitstream ve magic cookie bir
alıcının beklediğinin aynısıdır, ama örnekler öngörücü ve Rice kodlayıcıdan geçmek yerine
olduğu gibi saklanır. Bu, uyumluluk kazandırır, bant genişliği kazandırmaz — çerçeve
taşıdığı PCM'den 3 bayt büyüktür, yani yük hâlâ ~1,4 Mbit/s'tir. Gerçek sıkıştırma sonraki
bir adımın işi.

### Şifreleme hakkında

`--encrypt` klasik RAOP şifrelemesini açar: rastgele bir AES-128 anahtarı Apple'ın açık RSA
anahtarıyla sarmalanıp SDP'ye konur, her yük CBC ile şifrelenir (son tam olmayan blok açık
kalır, IV her pakette sıfırlanır).

Modern AirPlay 2 cihazları bu eski akışı kabul etmez: HomePod bu ANNOUNCE'a
`406 Not Acceptable` döner, çünkü eşleştirme tabanlı şifreleme bekler. Bu cihazlarda
şifresiz yayın zaten sorunsuz çalışır, o yüzden varsayılan kapalıdır. Seçenek eski
AirPort Express ve Apple TV modelleri için duruyor.

## Kullanım (Faz 5 — masaüstü uygulaması)

```powershell
dotnet run --project src\WinAirPlay.App
```

Pencere açılır açılmaz ağı tarar, en son kullanılan cihazı seçer ve beklemeye geçer.
Kapatma düğmesi uygulamayı sonlandırmaz, saatin yanına indirir; yayın arka planda sürer.
Tepsi simgesi durumu renkle gösterir (gri: bağlı değil, sarı: çalışıyor, yeşil: yayında,
kırmızı: hata) ve sağ tık menüsünden pencere açılıp bağlantı kesilebilir. Çıkmak için
tepsi menüsündeki "Çıkış" kullanılır.

Tampon kaydırıcısı yayın sırasında da çalışır: değeri değiştirdiğinizde bir sonraki sync
paketi yeni değerle gider, alıcı saatini yeniden hizalarken kısa bir kesinti duyulur.
Ses seviyesi kaydırıcısı RTSP `SET_PARAMETER` ile cihazın kendi ses seviyesini değiştirir,
Windows'unkini değil.

"Yayın sırasında hoparlörü kapat" varsayılan olarak açıktır: bağlanınca PC hoparlörü
susar, ses yalnızca HomePod'dan gelir; bağlantı kesilince hoparlör geri açılır.

Ayarlar `%APPDATA%\WinAirPlay\settings.json` içinde tutulur; beklenmeyen bir hata olursa
tam yığın izi aynı klasördeki `error.log` dosyasına yazılır.

`WinAirPlay.App` katmanları:

- `Services/StreamController` — keşif, el sıkışma, yakalama ve gönderimi tek bir durum
  makinesinde toplar; arayüzün bildiği tek şey budur
- `ViewModels/MainViewModel` — bağlanabilir durum; `IStreamController`, `ISettingsStore` ve
  `IUiDispatcher` üzerinden konuştuğu için pencere olmadan test edilebilir
- `Tray/TrayIconHost` — bildirim alanı simgesi ve menüsü; simge `TrayIconFactory` tarafından
  çalışma anında çizilir, projede ikon dosyası yoktur

## Testler

```powershell
dotnet test
```

## Microsoft Store (MSIX)

Store paketi için `src/WinAirPlay.Package/` projesi ve `docs/STORE_PUBLISHING.md` rehberine bakın.

```powershell
# Logo PNG'lerini üret ve MSIX derle (Visual Studio MSIX workload gerekir)
.\scripts\build-msix.ps1
```

Minimum Windows sürümü: **10.0.19041** (2004). Gizlilik politikası: `docs/PRIVACY_POLICY.md`.
