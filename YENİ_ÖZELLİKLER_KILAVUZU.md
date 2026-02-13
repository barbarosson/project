# Yeni Özellikler Kullanım Kılavuzu

## 🎯 Hero Carousel ve Arka Plan Desenleri

### Menüde Nerede?

Yeni özellikler artık **Admin** menüsü altında **Site Commander** bölümünde bulunuyor.

**Erişim Yolu:**
```
Sol Menü → Admin → Site Commander
```

---

## 🎨 1. Hero Carousel (Kayan Banner) Ekleme

### Adım Adım:

1. **Admin → Site Commander** sayfasına gidin
2. Sol taraftan **"Home"** sayfasını seçin
3. **"Content"** sekmesine tıklayın
4. **"Hero"** bölümünü açın
5. **"Add Banner"** butonuna basın

### Banner Alanları:

- **Background Image URL**: Banner arka plan resmi
  - Örnek: `https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg`

- **Title**: Ana başlık
  - Örnek: "İşinizi Dönüştürün"

- **Subtitle**: Alt başlık
  - Örnek: "Modulus ERP ile akıllı yönetim"

- **Button Text**: Buton yazısı (opsiyonel)
  - Örnek: "Hemen Başla"

- **Button Link**: Buton bağlantısı (opsiyonel)
  - Örnek: "/signup"

### Banner Yönetimi:

- ➕ **Ekle**: "Add Banner" butonu ile yeni banner ekleyin
- 🗑️ **Sil**: Banner'ın sağ üst köşesindeki çöp kutusu ikonu
- ↕️ **Sırala**: Yukarı/aşağı ok butonları ile sıralamayı değiştirin
- 👁️ **Önizleme**: Resim URL'si girdiğinizde otomatik önizleme

### Kaydetme:

- Tüm banner'ları ekledikten sonra **"Save Section"** butonuna basın
- Değişiklikler anında yayına girer

---

## 🎨 2. Arka Plan Desenleri

### Erişim:

1. **Admin → Site Commander** sayfasına gidin
2. **"Visual Styles"** sekmesine tıklayın
3. **"Background Patterns"** bölümünü açın

### Desen Seçenekleri:

1. **None (Yok)**: Desen yok
2. **Micro Dots**: Küçük nokta grid
3. **Circuit Grid**: Teknik devre deseni
4. **Soft Waves**: Yumuşak dalga deseni
5. **Custom URL**: Özel desen URL'si

### Ayarlar:

- **Pattern Type**: Yukarıdaki desenlerden birini seçin
- **Custom Pattern URL**: "Custom URL" seçiliyse buraya SVG dosya yolu girin
- **Pattern Opacity**: Desen şeffaflığı (0-100%)
  - Önerilen: %10-20%
- **Pattern Preview**: Canlı önizleme

### Kaydetme:

- **"Save Visual Styles"** butonuna basın
- Değişiklikler tüm sayfalara uygulanır

---

## 📊 3. Carousel Özellikleri

### Otomatik Oynatma:

- ✅ Her 5 saniyede bir otomatik geçiş
- ✅ Kullanıcı tıkladığında duraklar
- ✅ 5 saniye sonra tekrar başlar
- ✅ Tek banner varsa devre dışı

### Navigasyon:

- **Sol/Sağ Oklar**: Manuel geçiş
- **Nokta İndikatörler**: Hangi slide'da olduğunuzu gösterir
- **Tıklayarak Geçiş**: Noktalara tıklayarak istediğiniz slide'a gidin

### Mobil Uyumluluk:

- ✅ Tüm cihazlarda çalışır
- ✅ Dokunmatik kontroller
- ✅ Responsive tasarım

---

## 🚀 Hızlı Başlangıç Örnekleri

### Örnek 1: Tek Banner

```
Banner 1:
- Image URL: https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg
- Title: "Modulus ERP - Basit. Akıllı. Sağlam."
- Subtitle: "Modern işletmeler için tam kapsamlı yönetim"
- Button Text: "Ücretsiz Dene"
- Button Link: "/signup"
```

**Sonuç**: Statik hero banner (carousel yok), desen overlay aktif

### Örnek 2: 3 Slide Carousel

```
Banner 1:
- Image URL: /assets/banner1.jpg
- Title: "2026 Q1 - Yeni Özellikler"
- Subtitle: "AI destekli analizler ve gelişmiş raporlama"
- Button Text: "Yenilikleri Gör"
- Button Link: "/features"

Banner 2:
- Image URL: /assets/banner2.jpg
- Title: "10.000+ İşletmeye Katılın"
- Subtitle: "50+ ülkede güvenilir çözüm"
- Button Text: "Başarı Hikayeleri"
- Button Link: "/case-studies"

Banner 3:
- Image URL: /assets/banner3.jpg
- Title: "Kurumsal Düzey Güvenlik"
- Subtitle: "SOC 2 uyumlu, banka seviyesi şifreleme"
- Button Text: "Daha Fazla Bilgi"
- Button Link: "/security"
```

**Sonuç**: Tam carousel (oklar, noktalar, otomatik oynatma)

### Örnek 3: Desen Ayarları

```
Visual Styles → Background Patterns:
- Pattern Type: Circuit Grid
- Opacity: 15%
- Save Visual Styles
```

**Sonuç**: Tüm hero banner'larının arkasında %15 şeffaflıkta devre deseni

---

## 🎨 Hazır Resim Kaynakları

### Ücretsiz Stok Fotoğraf Siteleri:

1. **Pexels**: https://www.pexels.com/
   - Ücretsiz, telif hakkı yok
   - Yüksek kalite
   - Örnek URL formatı: `https://images.pexels.com/photos/ID/pexels-photo-ID.jpeg`

2. **Unsplash**: https://unsplash.com/
   - Profesyonel fotoğraflar
   - Ücretsiz kullanım

3. **Pixabay**: https://pixabay.com/
   - Çeşitli görseller
   - Ücretsiz lisans

### Önerilen Görsel Boyutları:

- **Genişlik**: 1920px (Full HD)
- **Yükseklik**: 1080px veya 600px
- **Format**: JPG veya WebP
- **Dosya Boyutu**: < 300KB (optimize edilmiş)

---

## ⚠️ Önemli Notlar

### Banner Ekleme:

1. **Resim URL'si mutlaka dolu olmalı** - Aksi halde banner görünmez
2. **HTTPS kullanın** - HTTP bağlantılar bazı tarayıcılarda engellenebilir
3. **Resim boyutlarını optimize edin** - Hızlı yüklenme için

### Desen Kullanımı:

1. **Şeffaflığı ayarlayın** - Çok koyu desenler metni okunaksız yapar
2. **Önizlemeyi kontrol edin** - Kaydetmeden önce nasıl göründüğüne bakın
3. **Marka uyumunu sağlayın** - Profesyonel görünüm için

### Performans:

1. **Maximum 5 banner** önerilir - Daha fazlası yükleme süresini artırır
2. **Optimize edilmiş resimler kullanın** - WebP formatı önerilir
3. **CDN kullanın** - Hızlı erişim için

---

## 🔧 Sorun Giderme

### "Carousel görünmüyor"

**Kontrol Listesi:**
1. Banner array'inde en az 1 banner var mı?
2. Image URL doğru ve erişilebilir mi?
3. "Save Section" butonuna bastınız mı?
4. Sayfayı yenileyerek tekrar deneyin

**Çözüm:**
```
Admin → Site Commander → Home → Content → Hero
→ Banner ekleyin
→ Save Section
→ Sayfayı yenileyin (F5)
```

### "Desen görünmüyor"

**Kontrol Listesi:**
1. Pattern Type "None" dışında seçili mi?
2. Opacity %0'dan büyük mü?
3. "Save Visual Styles" butonuna bastınız mı?

**Çözüm:**
```
Admin → Site Commander → Visual Styles → Background Patterns
→ Pattern Type: Circuit Grid seçin
→ Opacity: 15% yapın
→ Save Visual Styles
→ Sayfayı yenileyin
```

### "Otomatik oynatma çalışmıyor"

**Kontrol:**
- 2 veya daha fazla banner var mı?
- Tek banner varsa otomatik oynatma devre dışıdır

**Çözüm:**
- En az 2 banner ekleyin
- Her banner'da Image URL dolu olmalı

---

## 📞 Destek

Sorun yaşıyorsanız:

1. Browser console'unu kontrol edin (F12 tuşu)
2. Hata mesajlarını not alın
3. `/admin/diagnostics` sayfasına giderek sistem durumunu kontrol edin
4. Activity Log'u inceleyin

---

## ✅ Hızlı Kontrol Listesi

### Banner Eklemek İçin:
- [ ] Admin → Site Commander → Home seçtim
- [ ] Content sekmesine gittim
- [ ] Hero bölümünü açtım
- [ ] Add Banner'a tıkladım
- [ ] Image URL girdim
- [ ] Title ve Subtitle yazdım
- [ ] Save Section'a bastım
- [ ] Sayfayı yeniledim ve carousel'i gördüm

### Desen Eklemek İçin:
- [ ] Admin → Site Commander açtım
- [ ] Visual Styles sekmesine gittim
- [ ] Background Patterns açtım
- [ ] Desen seçtim (Circuit Grid, Micro Dots, vb.)
- [ ] Opacity ayarladım (%10-20 arası)
- [ ] Preview'da kontrol ettim
- [ ] Save Visual Styles'a bastım
- [ ] Ana sayfada deseni gördüm

---

**Başarılar! 🎉**

Yeni Hero Carousel ve Arka Plan Desenleri özelliklerini kullanarak web sitenize profesyonel bir görünüm kazandırabilirsiniz.
