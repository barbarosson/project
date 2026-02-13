# Typography Management System - Kullanım Kılavuzu

Site genelinde tüm font tiplerini, renklerini ve boyutlarını tek yerden yönetebilirsiniz.

## Özellikler

### 1. Font Yönetimi
- **Body Text**: Ana sayfa metinleri
- **Headings (H1-H6)**: Başlıklar (6 seviye)
- **UI Elements**: Butonlar, inputlar, label'lar
- **Special**: Kodlar, linkler, caption'lar

### 2. Ayarlanabilir Özellikler

Her element için şu özellikler değiştirilebilir:

#### Font Family (Font Ailesi)
- Inter, Roboto, Open Sans, Lato
- Montserrat, Poppins, Raleway
- Playfair Display, Merriweather, Georgia
- Monaco, JetBrains Mono (monospace)
- System UI ve daha fazlası

#### Font Weight (Font Kalınlığı)
- Thin (100) → Black (900) arası 9 farklı kalınlık
- Normal, Medium, Semi Bold, Bold vb.

#### Font Size (Font Boyutu)
- Piksel (16px), REM (1rem), EM (1.5em) ile
- Her element için özelleştirilebilir

#### Font Color (Font Rengi)
- Hex color picker ile
- Manuel hex kodu girişi (#000000)
- Element bazlı farklı renkler

#### Line Height (Satır Yüksekliği)
- Okunabilirlik için önemli
- Sayısal (1.5) veya birimli (24px)

#### Letter Spacing (Harf Aralığı)
- Tipografi detayı
- Pixel veya em cinsinden
- Başlıklar için özellikle yararlı

## Kullanım

### 1. Typography Controller'a Erişim

```
/admin/site-commander → Typography Tab
```

### 2. Element Seçimi

4 farklı kategoride elementler bulunur:

- **Headings**: H1, H2, H3, H4, H5, H6
- **Body & Text**: Body, Caption, Small
- **UI Elements**: Button, Input, Label
- **Special**: Code, Link

### 3. Değişiklikleri Kaydetme

- **Tek Element**: Her element kartında "Save" butonu
- **Tüm Elementler**: Sağ üstteki "Save All" butonu

### 4. Önizleme

- Her element kartında canlı önizleme
- "Show Preview" butonu ile tüm elementlerin genel görünümü
- Değişiklikler anında görünür

### 5. Sıfırlama

"Reset" butonu ile tüm ayarları varsayılan değerlere döndürme

## Teknolojik Detaylar

### Veritaşı Yapısı

Typography ayarları `ui_styles` tablosunda saklanır:

```sql
- element_name: Element adı (body, h1, button vb.)
- font_family: Font ailesi
- font_size_text: Font boyutu
- font_weight: Font kalınlığı
- font_color: Font rengi
- line_height_value: Satır yüksekliği
- letter_spacing_value: Harf aralığı
```

### Otomatik Uygulama

`UIStyleInjector` komponenti:
- Sayfa yüklendiğinde typography stillerini otomatik uygular
- CSS rules oluşturur ve DOM'a enjekte eder
- Real-time güncelleme desteği

### CSS Selector Mapping

- `body` → `body, .body-text`
- `h1` → `h1, .h1`
- `button` → `button, .btn, [role="button"]`
- `input` → `input, textarea, select, .input`
- `label` → `label, .label`
- `code` → `code, pre, .code`
- `link` → `a, .link`

## Örnekler

### Örnek 1: Tüm Başlıkları Kalın Yap

1. Headings tab'ına git
2. H1-H6 için Font Weight'i "Bold (700)" yap
3. "Save All" ile kaydet

### Örnek 2: Body Font'u Değiştir

1. Body & Text tab'ına git
2. Body için Font Family'yi "Roboto" seç
3. Font Size'ı "18px" yap
4. Save butonuna bas

### Örnek 3: Buton Yazılarını Özelleştir

1. UI Elements tab'ına git
2. Button için:
   - Font Weight: "Semi Bold (600)"
   - Letter Spacing: "0.02em"
   - Text Transform: "uppercase" (gelecekte eklenecek)
3. Save

## İpuçları

### Okunabilirlik İçin

- **Body Text**:
  - Font Size: 16-18px
  - Line Height: 1.5-1.7
  - Font Weight: 400 (Normal)

- **Headings**:
  - H1: 48px, Bold
  - H2: 36px, Bold
  - Letter Spacing: -0.01em ile -0.02em

### Profesyonel Görünüm

- Maksimum 2-3 font ailesi kullanın
- Heading için bir, body için bir font
- Font weight'leri tutarlı tutun

### Erişilebilirlik

- Font Size minimum 14px
- Kontrast oranına dikkat edin (WCAG AA standardı)
- Line Height en az 1.5 olmalı

## Gelecek Özellikler

- [ ] Text Transform (uppercase, lowercase, capitalize)
- [ ] Text Decoration (underline, line-through)
- [ ] Responsive font sizes
- [ ] Font pairing önerileri
- [ ] Erişilebilirlik skoru
- [ ] Google Fonts entegrasyonu
- [ ] Font preview galeri

## Sorun Giderme

### Değişiklikler Görünmüyor

1. Sayfayı yenileyin (F5)
2. Browser cache'i temizleyin
3. "Save" butonuna bastığınızdan emin olun

### Fontlar Yüklenmiyor

- Font family'nin doğru yazıldığından emin olun
- Sistem fontlarını kullanmayı deneyin

### Reset Çalışmıyor

- Tarayıcı geliştirici konsolunu kontrol edin
- Veritabanı bağlantısını kontrol edin

## Destek

Sorunlar için:
- `/admin/helpdesk` üzerinden ticket açın
- Live support ile iletişime geçin
