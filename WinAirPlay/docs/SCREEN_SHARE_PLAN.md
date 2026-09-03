# WinAirPlay — ekran paylaşımı (plan, kod yok)

Durum: **yapılabilir, ama mevcut HomePod ses ürününün küçük bir eklentisi değil.** Ayrı bir “Mirror” modu ve büyük bir protokol katmanı gerekir. Bu belge kod yazılmaz; onaydan sonra faz faz uygulanır.

## 1. Kısa cevap

| Soru | Cevap |
| --- | --- |
| Windows masaüstünü AirPlay ekrana göndermek teknik olarak mümkün mü? | Evet, sınırlı. |
| Bugünkü RAOP ses koduna 2–3 dosya ekleyerek olur mu? | Hayır. |
| HomePod / HomePod mini’ye görüntü gider mi? | Hayır — ekranları yok. |
| V1 hedef cihaz | Apple TV ve AirPlay alıcılı TV (Samsung/LG vb.), aynı LAN |
| Ses (HomePod) bozulur mu? | Bozulmamalı. Ayrı mod: Audio / Mirror |
| Store riski | Artar (AirPlay mirroring Apple’ın ana özelliği) |
| Rakip | AirParrot (~$18), ücretli “sender” pazarı |

WinAirPlay bugün: WASAPI loopback → RAOP (ALAC/AES) → hoparlör.  
Ekran paylaşımı: DXGI masaüstü kopyası → H.264 → AirPlay **mirroring** (HTTP + video RTP, RAOP değil).

Keşifte `_airplay._tcp` zaten taranıyor; oturum hâlâ yalnızca `_raop` sesi.

## 2. Ne paylaşılır (ürün tanımı)

Kullanıcı “Mirror” deyince:

- Tüm masaüstü (veya seçilen monitör)
- Masaüstü sesi (mevcut loopback; görüntüyle senkron)
- Apple TV / AirPlay ekranında pencere + ses

V1 dışı:

- Tek pencere yakalama (WGC) — V1.1
- Kamera / webcam
- HomePod’a görüntü
- AirPlay 2 FairPlay ile korunan yollar (çoğu yeni Apple TV yazılımı)
- DRM’li Netflix tam ekran (Desktop Duplication siyah kare verir)

## 3. Neden mevcut koda yapışmaz

```
Bugün:  Capture PCM → RAOP handshake → UDP audio
Gerekli: Capture DXGI frames → H.264 → AirPlay /stream (HTTP POST, binary plist)
         + ayrı ses saati (PTS) + alıcı özellikleri (width, fps, FairPlay)
```

`RaopHandshake` / `RaopRtpSender` video taşımaz. Yeni modül: `Mirror/` (Core’da UI’sız).

Windows yakalama tarafı **kolay** (DXGI Desktop Duplication + Media Foundation H.264).  
Zor olan **AirPlay video gönderici protokolü**: resmi spec yok; eski Apple TV (AirPlay 1 mirroring) kısmen reverse-engineer; yeni tvOS FairPlay/pairing kırılgan.

## 4. Fizibilite ve risk

| Katman | Zorluk | Not |
| --- | --- | --- |
| DXGI + H.264 encode | Orta | Win10+, GPU encode mümkün |
| Ses + görüntü senkron | Yüksek | 100–400 ms video gecikmesi; RAOP saati yetmez |
| AirPlay 1 mirror (eski Apple TV) | Yüksek | Spike şart: bir Apple TV’de 10 sn görüntü |
| AirPlay 2 / yeni tvOS | Çok yüksek | Pairing + şifre; başarısız olabilir — V1 kapsamı dışı tut |
| HomePod | İmkansız | Ekran yok |
| Store 11.1 / marka | Yüksek | Listing’de “not AirPlay mirroring by Apple”; isim zaten riskli |
| CPU / ısı | Orta | 1080p30 hedef; 4K sonra |

**Karar kapısı (Faz 0):** Sizin LAN’de bir **Apple TV** (veya AirPlay TV) yoksa V1 doğrulanamaz. Yalnızca HomePod varsa ekran paylaşımı ürünü yok.

## 5. Mimari (hedef)

```
WinAirPlay.Core
  Audio/          (mevcut — dokunulmaz sözleşmeler)
  Mirror/
    IDisplayCapture     DXGI
    IVideoEncoder       H.264 Annex-B
    IAirPlayMirrorSink  HTTP + RTP
    MirrorPipeline      yakala → encode → gönder, iptal
  Discovery/      cihaz yeteneği: AudioOnly | MirrorCapable
```

UI: cihaz listesinde rozet (`Audio` / `Screen`). Mod seçimi: **Audio** (varsayılan) | **Screen**. Screen seçilince HomePod satırları disabled veya “no display”.

## 6. Fazlar

Kod yok; onay sırası bu.

### Faz 0 — Spike (1–2 hafta, atılabilir prototip)

- DXGI ile 1080p30 dosyaya veya yerel preview
- MF H.264 encode
- Hedef: **bir Apple TV**’ye ham/deneysel stream (üçüncü parti protokol notları, GPL kod kopyalanmaz)
- Çıkış: 10 sn görüntü **veya** “bu tvOS sürümünde sender mümkün değil” raporu
- Başarısızsa proje durur; ses ürünü aynen kalır

### Faz 1 — Core Mirror iskeleti

- Arayüzler, test double, CLI `winairplay mirror --list-displays`
- Audio pipeline’a dokunma

### Faz 2 — Capture + encode

- Monitör seçimi, 1080p30, ~4–8 Mbps
- Cursor (fare) overlay isteğe bağlı V1.1

### Faz 3 — AirPlay mirror oturumu

- `_airplay._tcp` features bit (video)
- Handshake + H.264 gönderimi
- Başarısız cihazda İngilizce net hata

### Faz 4 — Ses eşlemesi

- Loopback + video PTS
- Ayrı RAOP ile çift oturum **deneme**; olmazsa mirror içi ses (protokol ne sunuyorsa)

### Faz 5 — UI

- Audio | Screen
- Ekran seçimi, durdur, tepsi “Mirroring”
- X hâlâ tepsi; görev çubuğu minimize (mevcut davranış)

### Faz 6 — Store

- Gizlilik: “screen contents stay on LAN”
- Screenshot: Apple TV’de masaüstü (Apple UI’si yok)
- Sertifika notu: DXGI, LAN, fullTrust
- FairPlay kırma / DRM atlatma **yok** (red + yasal)

## 7. Bilerek yapılmayacak (V1)

- HomePod’a görüntü iddiası
- “Netflix’i TV’ye gönder” (DRM siyah ekran)
- AirPlay 2 çoklu oda görüntü
- macOS alıcı gibi davranmak (Reflector tersi)

## 8. Efor (tek kişi, kabaca)

- Spike: 1–2 hafta
- V1 (Apple TV AirPlay 1 sınıfı): **6–12 hafta** spike yeşilse
- Spike kırmızıysa: **0** — ses uygulamasına geri dön

Karşılaştırma: mevcut ses yığını aylarca oturdu; mirroring o kadar veya daha uzun.

## 9. Alternatifler (AirPlay videosuz)

| Yol | Artı | Eksi |
| --- | --- | --- |
| Windows yerleşik **Miracast** / “Project” | Kod yok | AirPlay TV değil |
| Kullanıcı iPhone AirPlay ile TV | Sıfır geliştirme | PC ekranı değil |
| Ayrı ürün adı (AirPlay’siz) | Store 11.1 hafifler | Keşif zayıf |

## 10. Onay soruları

1. LAN’de **Apple TV veya AirPlay ekranlı TV** var mı? (Yoksa dur.)
2. V1 yalnızca o cihaz mı, yoksa “her AirPlay ekran” mı? (İkincisi gerçekçi değil.)
3. Store’daki ses uygulamasına mı gömülecek, yoksa sonra ayrı exe mi?

Kod, bu üç cevap ve Faz 0 spike yeşil olmadan yazılmamalı.
