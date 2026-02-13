# Site Commander Kapsamlı Test Kılavuzu

Bu doküman, Site Commander panelinin tüm özelliklerini test etmek için adım adım test senaryolarını içerir.

## 📋 Test Öncesi Hazırlık

### Gereksinimler
- Admin yetkisine sahip hesap ile giriş yapılmış olmalı
- `/admin/site-commander` sayfasında olmalısınız
- Browser Developer Tools açık olmalı (F12)
- Network tab'ı açık ve XHR isteklerini izleyebiliyor olmalı
- Console'da hataları görebiliyor olmalı

### Test Ortamı Kontrolü
1. ✅ Sayfanın tamamen yüklendiğini doğrulayın
2. ✅ Console'da kritik hata olmadığını kontrol edin
3. ✅ "Site Commander" başlığını görüyor olmalısınız
4. ✅ 7 tab görünüyor olmalı: Content, Design, Typography, Theme, Banners, Assets, Advanced

---

## 🎯 TAB 1: CONTENT (Sayfa İçerik Editörü)

### Test 1.1: Sayfa Listesi ve Seçimi
**Amaç:** Sol sidebardaki sayfa listesinin çalıştığını doğrulama

**Adımlar:**
1. Content tab'ına tıklayın
2. Sol tarafta "Pages" panelini görmelisiniz
3. Panelde sayfa listesi görünüyor mu kontrol edin
4. Her sayfa için:
   - Sayfa adı (name) görünüyor olmalı
   - URL slug'ı (örn: `/landing`) görünüyor olmalı
   - Eğer pasifse "Hidden" badge'i olmalı

**Beklenen Sonuçlar:**
- ✅ En az 1 sayfa görünmeli
- ✅ Varsayılan olarak bir sayfa seçili olmalı (mavi arkaplan)
- ✅ Seçili sayfanın içeriği sağda görünmeli

**Test Adımları:**
1. Farklı bir sayfaya tıklayın
2. Seçili sayfanın mavi arka plana sahip olduğunu doğrulayın
3. Sağdaki içeriğin değiştiğini gözlemleyin
4. Browser'ı yenileyin (F5)
5. Son seçili sayfa hala seçili olmalı (sessionStorage çalışıyor)

### Test 1.2: Sidebar Daraltma/Genişletme
**Adımlar:**
1. Sidebar'ın üstündeki menu ikonuna (☰) tıklayın
2. Sidebar daraltılmalı, sadece ikonlar görünmeli
3. Sağdaki content alanı genişlemeli
4. Tekrar menu ikonuna tıklayın
5. Sidebar genişlemeli

**Beklenen Sonuç:**
- ✅ Animasyon akıcı olmalı
- ✅ Grid layout otomatik ayarlanmalı (col-span-3 ↔ col-span-1)

### Test 1.3: Sayfa SEO Ayarları
**Amaç:** Sayfa meta bilgilerini düzenleme testi

**Adımlar:**
1. Herhangi bir sayfayı seçin
2. "Page Settings & SEO" kartını bulun
3. Şu alanları test edin:
   - **Page Title**: Metni değiştirin
   - **Meta Description**: Uzun bir açıklama yazın (150-160 karakter)
   - **Meta Keywords**: Virgülle ayrılmış kelimeler girin
   - **OG Image URL**: Geçerli bir resim URL'si girin

**Test Senaryoları:**

**Senaryo A: Başarılı Kayıt**
1. Tüm alanları doldurun
2. "Save Page Settings" butonuna tıklayın
3. Network tab'ında `cms_pages` tablosuna UPDATE isteği görmelisiniz
4. Yeşil success toast mesajı görmelisiniz: "Page settings saved successfully!"
5. Browser'ı yenileyin, değişiklikler kalıcı olmalı

**Senaryo B: Boş Alan Testi**
1. Page Title'ı boşaltın
2. Kaydet butonuna tıklayın
3. Kayıt başarılı olmalı (boş değer izin verilir)

**Senaryo C: Geçersiz OG Image URL**
1. OG Image alanına "geçersiz-url" yazın
2. Kaydet butonuna tıklayın
3. Kayıt başarılı olmalı (URL validasyonu yok)

### Test 1.4: Section Editörü - Accordion Çalışması
**Amaç:** Sayfa section'larının açılıp kapanması

**Adımlar:**
1. "Page Sections" kartını bulun
2. Eğer section yoksa, "No sections found" mesajı görmelisiniz
3. Eğer section varsa:
   - Her section için accordion item görünmeli
   - Section adı görünmeli
   - Section key badge'i (örn: `hero_section`) görünmeli
   - Pasif section'larda "Hidden" badge'i olmalı

**Accordion Testi:**
1. İlk section'a tıklayın - açılmalı
2. İkinci section'a tıklayın - o da açılmalı (multiple açılabilir)
3. İlk section'a tekrar tıklayın - kapanmalı
4. Browser'ı yenileyin
5. Son açık bıraktığınız section'lar hala açık olmalı (sessionStorage)

### Test 1.5: Dynamic Field Renderer - Alan Tipleri
**Amaç:** Her section içinde farklı alan tiplerini test etme

**Adımlar:**
1. Bir section açın
2. Görüntülenen alan tiplerine göre test edin:

**String/Text Alanları:**
- Normal Input alanı görünmeli
- Değeri değiştirin
- "Save [Section Name]" butonuna tıklayın
- Success mesajı almalısınız

**Rich Text/HTML Alanları:**
- TipTap editör görünmeli
- Toolbar'da formatting butonları olmalı
- Metin yazın, bold/italic yapın
- Kaydedin

**Boolean Alanları:**
- Switch komponenti görünmeli
- ON/OFF yapabilmeli

**Array Alanları:**
- Liste görünmeli
- "Add Item" butonu olmalı
- Her item için "Remove" butonu olmalı

**Object Alanları:**
- Nested form görünmeli
- Alt alanlar render edilmeli

### Test 1.6: Section Kaydetme - Payload Validasyon
**Amaç:** Büyük içeriklerin optimize edilip kaydedilmesi

**Senaryo A: Normal Boyutlu İçerik**
1. Bir section açın
2. Birkaç alan doldurun
3. "Save [Section]" butonuna tıklayın
4. Network tab'ında `cms_page_sections` UPDATE isteği görün
5. Success toast: "Section saved successfully!"

**Senaryo B: Çok Büyük İçerik (Payload Test)**
1. Bir text alanına çok uzun içerik yapıştırın (10000+ karakter)
2. Ya da çok büyük bir base64 image string'i ekleyin
3. Kaydet'e tıklayın
4. Console'da şunları görmelisiniz:
   - "⚠️ Large payload detected: XMB"
   - Optimization mesajları
5. Eğer 2MB'dan büyükse hata almalısınız: "Content is too large to save"

**Senaryo C: Çoklu Section Kaydetme**
1. Birden fazla section açın ve değişiklik yapın
2. En üstteki "Save All Changes" butonuna tıklayın
3. Tüm section'lar sırayla kaydedilmeli
4. Success: "All changes saved successfully!"
5. Eğer bazıları başarısız olursa: "Saved X sections, Y failed..."

### Test 1.7: Preview Fonksiyonu
**Adımlar:**
1. Sağ üstteki "Preview Site" butonuna tıklayın
2. Yeni tab açılmalı: `/landing?preview=true`
3. Yaptığınız değişiklikleri görmeli

---

## 🎨 TAB 2: DESIGN (Tasarım Kontrolcüsü)

### Test 2.1: Sayfa Yapısı ve Layout
**Adımlar:**
1. Design tab'ına tıklayın
2. Sayfa iki sütuna bölünmeli:
   - Sol: Design Controller (form alanları)
   - Sağ: Live Preview (sticky)

**Beklenen Görünüm:**
- ✅ Live Preview kartı sağda sabitlenmeli (sticky top-4)
- ✅ Aşağı kaydırdığınızda preview yukarıda kalmalı

### Test 2.2: Logo Boyutları - Slider Testi
**Amaç:** Logo genişlik/yükseklik ayarlarının gerçek zamanlı çalışması

**Test Adımları:**

**Header Logo Genişliği:**
1. Design Controller'da "Logo Sizes" kartını bulun
2. "Header Logo Width" slider'ını bulun
3. Slider'ı sağa kaydırın (örn: 200px)
4. **Anında Kontrol:** Sağdaki Live Preview'da logo genişliyor mu?
5. CSS değişkenini kontrol: Developer Tools → Elements → :root
   - `--logo-header-width: 200px` olmalı
6. 500ms bekleyin
7. Network tab'ında `ui_styles` tablosuna UPDATE isteği görmelisiniz
8. Slider değeri altında px değeri görünmeli

**Header Logo Yüksekliği:**
1. "Header Logo Height" slider'ını test edin (20px - 200px)
2. Live Preview'da logo yüksekliği değişmeli
3. Hem slider hem input'tan değer girilebilmeli

**Footer Logo Boyutları:**
1. "Footer Logo Width" ve "Footer Logo Height" slider'larını test edin
2. Live Preview'da footer logo preview'ı güncellenmeli

**Input Manuel Değer Girişi:**
1. Slider'ın yanındaki input alanına tıklayın
2. Manuel değer girin (örn: 180)
3. Enter'a basın veya focus'u kaybettirin
4. Değer uygulanmalı ve kaydedilmeli

### Test 2.3: Logo Preview - Dinamik Güncelleme
**Amaç:** Logo URL değiştiğinde preview'ın güncellenmesi

**Adımlar:**
1. Live Preview kartında iki logo preview kutusu görünmeli:
   - Header Logo
   - Footer Logo
2. Her kutuda:
   - Gri arkaplan üzerinde logo görünmeli
   - Logo yoksa "Logo" placeholder görünmeli
   - Altında boyut bilgisi: "Width: var(--logo-header-width) × Height: ..."

**Dinamik Test:**
1. Theme tab'ına gidin
2. Logo URL'ini değiştirin
3. Design tab'ına geri dönün
4. Logo preview otomatik güncellenmiş olmalı (useEffect ile)

### Test 2.4: Renk Ayarları - Real-time Color Picker
**Amaç:** Renk değişikliklerinin anında uygulanması

**Test Kategorileri:**

**Brand Colors (Marka Renkleri):**
1. "Brand Colors" kartını açın
2. Her renk için 2 input var:
   - Color picker (renkli kare)
   - Text input (hex kodu)

**Primary Color Testi:**
1. "Primary Background" rengini bulun
2. Color picker'a tıklayın
3. Yeni bir renk seçin (örn: kırmızı #ff0000)
4. **Anında:** CSS değişkeni güncellenmeli
5. 500ms sonra: Network'te UPDATE isteği
6. Text input'ta hex değeri görünmeli

**Hex Kodu Manuel Giriş:**
1. Text input'a tıklayın
2. "#0080ff" yazın
3. Renk uygulanmalı
4. Color picker rengi otomatik güncellenmeli

**Tüm Kategori Renkleri:**
Test edilecek renkler:
- Brand Colors
  - Primary Background
  - Secondary Background
  - Accent Background
  - Primary Text
  - Secondary Text
- Button Colors
  - Primary Button
  - Secondary Button
  - Accent Button
  - Destructive Button
- Status Colors
  - Success
  - Warning
  - Error
  - Info
- UI Colors
  - Border
  - Card Background
  - Navbar Background
  - Footer Background

### Test 2.5: Spacing & Layout Ayarları
**Amaç:** Boşluk ve düzen ayarlarının testi

**Test Edilecek Slider'lar:**
1. **Section Padding Top** (0-200px)
   - Slider'ı hareket ettirin
   - CSS variable güncellensin: `--section-padding-top`

2. **Section Padding Bottom** (0-200px)
3. **Container Max Width** (800-1600px)
4. **Header Height** (40-120px)
5. **Header Padding X** (0-80px)

**Her Slider için:**
1. Min değere getirin
2. Max değere getirin
3. Ortada bir değer seçin
4. Manuel input'tan değer girin
5. Kaydedildiğini doğrulayın

### Test 2.6: Section Visibility Toggles
**Amaç:** Sayfa section'larını göster/gizle

**Adımlar:**
1. "Section Visibility" kartını bulun
2. Her section için:
   - Section adı
   - Durum (Visible/Hidden badge)
   - Switch butonu
   - Yeşil göz ikonu (visible) veya gri göz ikonu (hidden)

**Toggle Testi:**
1. Bir section'ın switch'ini OFF yapın
2. **Anında:** Göz ikonu gri olmalı, "Hidden" yazmalı
3. Success toast: "Hiding section" veya "Showing section"
4. Network'te UPDATE isteği görülmeli
5. Sayfa yenilendikten sonra durum kalıcı olmalı

**Toplu Test:**
1. Tüm section'ları OFF yapın
2. Hepsini tekrar ON yapın
3. Her birinin doğru kaydedildiğini kontrol edin

### Test 2.7: Live Preview - MutationObserver
**Amaç:** CSS değişkenlerinin gerçek zamanlı izlenmesi

**Test:**
1. Design tab'ındayken Developer Tools'u açın
2. Elements sekmesinde `:root` elementini bulun
3. Bir slider değiştirin
4. `:root` üzerinde `style` attribute'u değişmeli
5. Live Preview anında güncellenmeli

**CSS Variables Kontrolü:**
Console'da test:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--logo-header-width')
```
Slider değeriyle eşleşmeli.

---

## ✍️ TAB 3: TYPOGRAPHY (Tipografi Ayarları)

### Test 3.1: Typography Controller Yüklemesi
**Adımlar:**
1. Typography tab'ına tıklayın
2. Loading spinner görünmeli (kısa süre)
3. Sayfa yüklendikten sonra:
   - Üstte "Typography Controller" başlığı
   - "Save All Typography" butonu
   - Alt tablar (Elements, Headings, Components)

### Test 3.2: Element Tabları
**Adımlar:**
1. "Elements" alt tab'ına tıklayın
2. Her tipografi elementi için kart görünmeli:
   - Body Text
   - H1, H2, H3, H4, H5, H6
   - Button Text
   - Input Fields
   - Form Labels
   - Links

### Test 3.3: Font Ailesi Değiştirme
**Amaç:** Font family seçiminin testi

**Adımlar:**
1. "Body Text" kartını bulun
2. "Font Family" dropdown'ını açın
3. Mevcut fontlar:
   - Inter
   - Roboto
   - Open Sans
   - Lato
   - Montserrat
   - Poppins
   - Raleway
   - Playfair Display
   - Merriweather
   - Georgia
   - Monaco
   - JetBrains Mono
   - System UI

**Test:**
1. "Montserrat" seçin
2. Preview alanında font değişmeli
3. "Save" butonuna tıklayın
4. Success toast görünmeli
5. Sayfa yenilendikten sonra seçim korunmalı

### Test 3.4: Font Boyutu Ayarlama
**Adımlar:**
1. Herhangi bir elementin "Font Size" alanını bulun
2. Değeri değiştirin (örn: "18px")
3. Preview'da metin büyümeli
4. Geçersiz değer test: "abc" yazın
5. Kaydet butonuna tıklayın
6. Geçerli birimler: px, rem, em, %

**Test Değerleri:**
- Normal: "16px"
- Büyük: "24px"
- Rem: "1.5rem"
- Em: "1.2em"
- Yüzde: "120%"

### Test 3.5: Font Ağırlığı (Weight)
**Adımlar:**
1. "Font Weight" dropdown'ını açın
2. Seçenekler:
   - 100 - Thin
   - 200 - Extra Light
   - 300 - Light
   - 400 - Normal
   - 500 - Medium
   - 600 - Semi Bold
   - 700 - Bold
   - 800 - Extra Bold
   - 900 - Black

**Test:**
1. Her ağırlığı deneyin
2. Preview'da metin kalınlığı değişmeli
3. Tümünü kaydedin

### Test 3.6: Font Rengi
**Adımlar:**
1. "Font Color" alanını bulun
2. Color picker ile renk seçin
3. Veya hex kodu girin (örn: #333333)
4. Preview'da metin rengi değişmeli

**Kontrast Testi:**
1. Çok açık bir renk seçin (#ffffff)
2. Beyaz arkaplanda okunamaz olmalı
3. Geçerli ama uyarı vermez

### Test 3.7: Line Height (Satır Aralığı)
**Adımlar:**
1. "Line Height" alanına değer girin
2. Geçerli formatlar:
   - Sayı: "1.5"
   - Birimli: "24px", "1.5em"
   - Yüzde: "150%"

**Test:**
1. "1.2" girin - sıkışık
2. "2.0" girin - geniş
3. Preview'da satır aralığı görünmeli

### Test 3.8: Letter Spacing (Harf Aralığı)
**Adımlar:**
1. "Letter Spacing" alanını doldurun
2. Geçerli değerler:
   - "0px" - normal
   - "1px" - geniş
   - "-0.5px" - dar
   - "0.05em" - relatif

**Test:**
1. Pozitif değer: "2px"
2. Negatif değer: "-1px"
3. Preview'da harf aralığı değişmeli

### Test 3.9: Text Transform & Decoration
**Adımlar:**
1. "Text Transform" dropdown:
   - none
   - uppercase
   - lowercase
   - capitalize

2. "Text Decoration" dropdown:
   - none
   - underline
   - line-through
   - overline

**Test:**
1. "uppercase" + "underline" kombinasyonu deneyin
2. Preview'da uygulandığını görün

### Test 3.10: Preview Modu
**Adımlar:**
1. "Enable Preview Mode" switch'ini ON yapın
2. Sayfa preview moduna geçmeli
3. Tüm değişiklikler canlı görünmeli
4. OFF yapın, normal moda dönmeli

### Test 3.11: Toplu Kaydetme
**Adımlar:**
1. Birden fazla elementi değiştirin:
   - Body text'in font'unu değiştirin
   - H1'in boyutunu değiştirin
   - Button text'in rengini değiştirin
2. "Save All Typography" butonuna tıklayın
3. Tüm değişiklikler kaydedilmeli
4. Success toast görünmeli

### Test 3.12: Reset Fonksiyonu
**Adımlar:**
1. Birkaç değişiklik yapın
2. "Reset to Defaults" butonuna tıklayın (varsa)
3. Tüm ayarlar varsayılana dönmeli
4. Confirm dialog çıkmalı

---

## 🎨 TAB 4: THEME (Tema Ayarları)

### Test 4.1: Theme Settings Yüklemesi
**Adımlar:**
1. Theme tab'ına tıklayın
2. Loading state görünmeli
3. 3 alt tab görünmeli:
   - Branding
   - Colors
   - Advanced

### Test 4.2: Branding Tab - Logo Yükleme
**Adımlar:**
1. "Branding" alt tab'ına tıklayın
2. "Logo URL (Light Mode)" alanını görün
3. "Logo URL (Dark Mode)" alanını görün

**Logo URL Testi:**
1. Light logo URL'ine geçerli bir resim URL'si girin
   - Örnek: `https://itvrvouaxcutpetyzhvg.supabase.co/storage/v1/object/public/assets/logo.png`
2. Dark logo URL'ine farklı bir URL girin
3. Preview'da logo görünmeli
4. "Save Theme Settings" butonuna tıklayın

**Geçersiz URL Testi:**
1. "invalid-url" yazın
2. Kaydedin
3. Başarılı olmalı ama logo yüklenmeyecektir

**Boş URL Testi:**
1. URL alanını boşaltın
2. Kaydedin
3. Logo placeholder görünmeli

### Test 4.3: Colors Tab - Renk Paletleri
**Adımlar:**
1. "Colors" alt tab'ına tıklayın
2. Renk kategorileri görünmeli:
   - Primary Colors
   - Secondary Colors
   - Accent Colors
   - Status Colors (Success, Warning, Error, Info)
   - Text Colors
   - Background Colors
   - UI Colors (Card, Navbar, Footer)

**Her Renk için Test:**
1. Color picker'ı açın
2. Yeni renk seçin
3. Hex input'a değer yazın
4. Kaydedin
5. Site genelinde bu renkler uygulanmalı

**Renk Uyumluluğu Testi:**
1. Tüm primary renkleri mavi tonlarında tutun
2. Secondary'yi gri yapın
3. Accent'i turuncu yapın
4. Kaydedin ve site'i kontrol edin

### Test 4.4: Font Ayarları
**Adımlar:**
1. "Advanced" alt tab'ına gidin
2. "Heading Font" dropdown'ı bulun
3. "Body Font" dropdown'ı bulun

**Test:**
1. Heading için "Playfair Display" seçin (serif)
2. Body için "Inter" seçin (sans-serif)
3. Kaydedin
4. Sayfalarda başlıklar ve body metni farklı fontlarda olmalı

### Test 4.5: Font Size Base
**Adımlar:**
1. "Font Size Base" alanına değer girin
2. Geçerli değerler: "14px", "16px", "18px"
3. Bu tüm relative boyutları etkiler
4. Kaydedin ve siteyi kontrol edin

### Test 4.6: Border Radius (Köşe Yuvarlama)
**Adımlar:**
1. "Border Radius" alanını bulun
2. Test değerleri:
   - "0px" - keskin köşeler
   - "4px" - hafif yuvarlak
   - "8px" - orta
   - "16px" - çok yuvarlak
   - "9999px" - tamamen yuvarlak (pill shape)

3. "Button Radius" alanını ayrı test edin

**Görsel Test:**
1. 0px ile kaydedin → kartlar ve butonlar keskin köşeli
2. 16px ile kaydedin → yumuşak köşeler

### Test 4.7: Custom CSS
**Adımlar:**
1. "Custom CSS" textarea'sını bulun
2. Özel CSS kodu ekleyin:
```css
.custom-test {
  background: linear-gradient(45deg, #ff0000, #0000ff);
  padding: 20px;
}
```
3. Kaydedin
4. Site'te bu CSS uygulanmalı

**Geçersiz CSS Testi:**
1. Hatalı CSS yazın:
```css
.broken { color: ; }
```
2. Kaydedin
3. Hata vermemeli ama CSS uygulanmayacak

### Test 4.8: Theme Settings Kaydetme
**Adımlar:**
1. Tüm alanlarda değişiklik yapın
2. "Save Theme Settings" butonuna tıklayın
3. Loading state görünmeli
4. Success toast: "Theme settings saved successfully!"
5. Network'te `site_config` UPDATE isteği görün
6. Sayfa yenileyin, değişiklikler kalmalı

---

## 🎬 TAB 5: BANNERS (Banner Yönetimi)

### Test 5.1: Banner Listesi
**Adımlar:**
1. Banners tab'ına tıklayın
2. Mevcut banner'lar tablo halinde görünmeli
3. Her banner için:
   - Thumbnail image
   - Title (EN/TR)
   - Position (hero, header, footer, etc.)
   - Page slug
   - Status (Active/Inactive badge)
   - Language badge (TR/EN/ALL)
   - Actions (Edit, Delete, Reorder)

### Test 5.2: Yeni Banner Oluşturma
**Adımlar:**
1. "Add New Banner" butonuna tıklayın
2. Dialog açılmalı
3. Formu doldurun:

**Zorunlu Alanlar:**
- Title (EN): "Test Banner"
- Title (TR): "Test Banner TR"
- Position: "hero" (dropdown'dan seçin)
- Page: "landing" (dropdown'dan seçin)
- Background Color: "#3b82f6" (color picker)
- Text Color: "#ffffff"

**Opsiyonel Alanlar:**
- Description (EN): "This is a test description"
- Description (TR): "Bu bir test açıklamasıdır"
- CTA Text (EN): "Learn More"
- CTA Text (TR): "Daha Fazla"
- CTA Link: "/pricing"
- Image URL: (Asset picker'dan seçin)

**Görsel Ayarlar:**
- Layout Type: "full-width" seçin
- Height: "500px"
- Content Alignment: "center"
- Image Position: "background"
- Overlay Opacity: 50 (slider)
- Full Width Image: ON

**Zaman Ayarları:**
- Start Date: Bugünün tarihi
- End Date: 1 hafta sonra
- Language: "all"
- Active: ON

3. "Save Banner" butonuna tıklayın

**Beklenen Sonuç:**
- ✅ Success toast
- ✅ Dialog kapanmalı
- ✅ Yeni banner listede görünmeli
- ✅ Preview'da aktif olmalı

### Test 5.3: Banner Düzenleme
**Adımlar:**
1. Bir banner'ın "Edit" butonuna tıklayın
2. Dialog açılmalı, mevcut değerler dolu olmalı
3. Birkaç alanı değiştirin:
   - Title'ı değiştirin
   - Background rengini değiştirin
   - CTA Text'i değiştirin
4. "Update Banner" butonuna tıklayın
5. Değişiklikler uygulanmalı

### Test 5.4: Asset Picker Testi
**Adımlar:**
1. Banner formunda "Image URL" alanını bulun
2. "Browse Assets" butonuna tıklayın (varsa)
3. Asset picker dialog açılmalı
4. Mevcut resimler görünmeli
5. Bir resim seçin
6. URL otomatik doldurulmalı

**Manuel URL Girişi:**
1. Asset picker kullanmadan direkt URL yapıştırın
2. Geçerli olmalı

### Test 5.5: Background Pattern Testi
**Adımlar:**
1. Banner formunda "Background Pattern" dropdown'ını bulun
2. Seçenekler:
   - none
   - dots
   - grid
   - waves
   - circuit

3. Her pattern'i deneyin
4. Preview'da pattern değişmeli
5. Kaydedin

### Test 5.6: Layout Type Değişimi
**Adımlar:**
1. "Layout Type" dropdown'ını açın
2. Seçenekler:
   - compact: Kompakt banner
   - full-width: Tam genişlik
   - hero: Hero section
   - custom: Özel

3. Her layout'u deneyin
4. Height değerini değiştirin (300px - 800px arası)
5. Content Alignment: left, center, right test edin

### Test 5.7: Banner Sıralama
**Adımlar:**
1. Banner listesinde "Move Up" ▲ butonuna tıklayın
2. Banner bir üst sıraya gitmeli
3. "Move Down" ▼ butonuna tıklayın
4. Banner bir alt sıraya gitmeli
5. order_index otomatik güncellenmeli
6. Sayfa yenilendikten sonra sıra korunmalı

### Test 5.8: Banner Aktif/Pasif
**Adımlar:**
1. Banner'ın "Active" switch'ini OFF yapın
2. Badge "Inactive" olmalı
3. Landing page'de banner görünmemeli
4. Tekrar ON yapın
5. Banner aktif olmalı

### Test 5.9: Banner Silme
**Adımlar:**
1. Bir banner'ın "Delete" butonuna tıklayın
2. Confirm dialog çıkmalı:
   - "Are you sure you want to delete this banner?"
3. "Cancel" butonuna tıklayın → iptal edilmeli
4. Tekrar "Delete"e tıklayın
5. "Confirm" butonuna tıklayın
6. Banner silinmeli
7. Success toast görünmeli

### Test 5.10: Çoklu Dil Banner Testi
**Adımlar:**
1. Language: "tr" seçili bir banner oluşturun
2. Language: "en" seçili başka bir banner oluşturun
3. Language: "all" seçili üçüncü banner oluşturun

**Test:**
1. Site'i Türkçe dilinde açın → "tr" ve "all" banner'lar görünmeli
2. İngilizce'ye geçin → "en" ve "all" banner'lar görünmeli

### Test 5.11: Tarih Bazlı Banner Gösterimi
**Adımlar:**
1. Start Date: Yarın
2. End Date: 1 hafta sonra
3. Aktif yapın
4. Kaydedin

**Test:**
- Bugün bu banner görünmemeli (henüz başlamamış)
- Yarın görünmeye başlamalı
- 1 hafta sonra otomatik kaybolmalı

---

## 📁 TAB 6: ASSETS (Asset Yönetimi)

### Test 6.1: Assets Manager Görünümü
**Adımlar:**
1. Assets tab'ına tıklayın
2. "Assets Manager" başlığı görünmeli
3. "Upload New Asset" butonu görünmeli
4. Mevcut asset'ler grid halinde görünmeli

### Test 6.2: Asset Yükleme
**Adımlar:**
1. "Upload New Asset" butonuna tıklayın
2. File picker açılmalı
3. Bir resim seçin (JPG, PNG, SVG)

**Desteklenen Formatlar:**
- .jpg, .jpeg
- .png
- .gif
- .svg
- .webp

**Boyut Limiti:**
- Maksimum: 5MB (örnekleme)

**Test Senaryoları:**

**Senaryo A: Başarılı Yükleme**
1. 2MB'lık bir PNG seçin
2. Upload progress görünmeli
3. Success toast: "Asset uploaded successfully!"
4. Yeni asset listede görünmeli

**Senaryo B: Çok Büyük Dosya**
1. 10MB'lık bir resim seçin
2. Hata mesajı: "File too large. Maximum 5MB"
3. Upload gerçekleşmemeli

**Senaryo C: Geçersiz Format**
1. .exe veya .zip dosyası seçin
2. Hata: "Invalid file type"

**Senaryo D: Aynı İsimde Dosya**
1. Daha önce yüklediğiniz dosyayı tekrar yükleyin
2. Dosya üzerine yazmalı veya farklı isimle eklenmeli

### Test 6.3: Asset Önizleme
**Adımlar:**
1. Her asset kartında:
   - Thumbnail görüntü
   - Dosya adı
   - Dosya boyutu
   - Yükleme tarihi
   - Actions (Copy URL, Delete)

2. Bir asset kartına tıklayın
3. Büyük önizleme açılmalı (modal)
4. Tam çözünürlükte görüntü görünmeli
5. "Close" ile kapatın

### Test 6.4: URL Kopyalama
**Adımlar:**
1. Bir asset'in "Copy URL" butonuna tıklayın
2. URL clipboard'a kopyalanmalı
3. Toast mesajı: "URL copied to clipboard!"
4. Başka bir yere yapıştırın (Ctrl+V)
5. URL geçerli olmalı:
   - Format: `https://[project].supabase.co/storage/v1/object/public/assets/[filename]`

### Test 6.5: Asset Silme
**Adımlar:**
1. Bir asset'in "Delete" butonuna tıklayın
2. Confirm dialog: "Are you sure? This cannot be undone."
3. "Cancel" → iptal
4. "Confirm" → silme işlemi
5. Asset listeden kalkmalı
6. Storage'dan da silinmiş olmalı

**Kullanımda Olan Asset Silme:**
1. Bir banner'da kullanılan resmi silin
2. Silme başarılı olmalı
3. Banner'da resim artık yüklenmeyecek (404)

### Test 6.6: Asset Arama/Filtreleme
**Adımlar:**
1. "Search Assets" input alanını bulun (varsa)
2. Dosya adı yazın
3. Liste filtrelenmeli
4. Aramayı temizleyin
5. Tüm asset'ler tekrar görünmeli

### Test 6.7: Asset Sıralama
**Adımlar:**
1. "Sort by" dropdown'ı bulun
2. Seçenekler:
   - Date (newest first)
   - Date (oldest first)
   - Name (A-Z)
   - Name (Z-A)
   - Size (largest first)
   - Size (smallest first)

3. Her sıralamayı test edin
4. Liste doğru sıralanmalı

### Test 6.8: Toplu İşlemler
**Adımlar:**
1. Birden fazla asset seçin (checkbox ile)
2. "Bulk Actions" butonu aktif olmalı
3. "Delete Selected" seçeneğine tıklayın
4. Confirm dialog
5. Tüm seçili asset'ler silinmeli

### Test 6.9: Storage Kullanımı
**Adımlar:**
1. Sayfanın üstünde storage bilgisi görünmeli:
   - "Used: 12.5 MB / 1 GB"
   - Progress bar
2. Dosya yükledikçe bu değer artmalı
3. Dosya sildikçe azalmalı

---

## ⚙️ TAB 7: ADVANCED (Gelişmiş Ayarlar)

### Test 7.1: Site Bilgileri
**Adımlar:**
1. Advanced tab'ına tıklayın
2. Alt tablar görünmeli:
   - General
   - SEO
   - Contact
   - Statistics
   - Maintenance
   - Custom Code

### Test 7.2: General Tab - Site Adı ve Slogan
**Adımlar:**
1. "General" alt tab'ına tıklayın
2. Formu doldurun:

**Site Name (English):** "My Awesome SaaS"
**Site Name (Turkish):** "Benim Harika SaaS'ım"
**Tagline (English):** "The best solution for your business"
**Tagline (Turkish):** "İşiniz için en iyi çözüm"

3. "Save Settings" butonuna tıklayın
4. Success toast görünmeli
5. Bu değerler site genelinde kullanılacak

**Görsel Test:**
1. Landing page'e gidin
2. Header'da site adı görünmeli
3. Meta title'da kullanılmalı

### Test 7.3: SEO Tab - Meta Bilgileri
**Adımlar:**
1. "SEO" alt tab'ına tıklayın
2. Alanlar:

**Meta Title (EN):** "Best SaaS Platform | My Awesome SaaS"
**Meta Title (TR):** "En İyi SaaS Platformu | Benim Harika SaaS'ım"

**Meta Description (EN):**
"Discover the best SaaS platform for your business needs. Easy to use, powerful features, affordable pricing."

**Meta Description (TR):**
"İş ihtiyaçlarınız için en iyi SaaS platformunu keşfedin. Kullanımı kolay, güçlü özellikler, uygun fiyatlar."

**Keywords (EN):** "saas, platform, business, software, cloud"
**Keywords (TR):** "saas, platform, iş, yazılım, bulut"

**OG Image URL:** Asset picker'dan bir resim seçin

3. Kaydedin

**SEO Test:**
1. Landing page'in kaynak kodunu görüntüleyin (Ctrl+U)
2. `<meta>` tag'leri kontrol edin:
```html
<title>Best SaaS Platform | My Awesome SaaS</title>
<meta name="description" content="Discover the best..." />
<meta property="og:image" content="..." />
```

### Test 7.4: Contact Tab - İletişim Bilgileri
**Adımlar:**
1. "Contact" alt tab'ına tıklayın
2. Formu doldurun:

**Email:** "info@myawesomesaas.com"
**Phone:** "+90 555 123 4567"
**Address:** "İstanbul, Türkiye"

3. Kaydedin
4. Footer'da bu bilgiler görünmeli

**Email Validasyon Testi:**
1. "invalid-email" yazın
2. Kaydetmeye çalışın
3. Browser native validasyon çalışmalı

### Test 7.5: Statistics Tab - İstatistikler
**Adımlar:**
1. "Statistics" alt tab'ına tıklayın
2. Sayısal alanlar:

**Trust Badge (EN):** "Trusted by 1000+ businesses"
**Trust Badge (TR):** "1000+ işletme tarafından güvenilir"

**Customers Count:** 1500
**Transactions Count:** 50000
**Years Active:** 5
**Satisfaction Rate:** 98

3. Kaydedin

**Görsel Test:**
1. Landing page'e gidin
2. "Numbers That Matter" section'ına gidin
3. Bu sayılar görünmeli
4. Animasyonlu sayı artışı çalışmalı

### Test 7.6: Maintenance Mode
**Adımlar:**
1. "Maintenance" alt tab'ına tıklayın
2. "Enable Maintenance Mode" switch'i görünmeli
3. Mesaj alanları:

**Maintenance Message (EN):**
"We're currently performing scheduled maintenance. Please check back soon!"

**Maintenance Message (TR):**
"Şu anda planlanmış bakım yapıyoruz. Lütfen kısa süre sonra tekrar kontrol edin!"

4. Switch'i ON yapın
5. "Save" butonuna tıklayın

**Test:**
1. Yeni incognito pencere açın
2. Ana sayfaya gidin
3. Maintenance sayfası görünmeli
4. Admin paneline erişebiliyor olmalısınız (bypass)
5. Switch'i OFF yapın
6. Site normal açılmalı

**IP Whitelist Testi:**
1. "Allowed IPs" alanına IP adresi ekleyin
2. Bu IP'den gelen istekler maintenance bypass etmeli

### Test 7.7: Custom Code Tab
**Adımlar:**
1. "Custom Code" alt tab'ına tıklayın
2. "Custom CSS" textarea görünmeli
3. Özel CSS ekleyin:

```css
/* Custom Styles */
.landing-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.custom-button {
  border-radius: 50px;
  padding: 15px 40px;
  font-weight: bold;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}
```

4. Kaydedin
5. Site'te bu CSS'ler uygulanmalı

**JavaScript Ekleme (varsa):**
```javascript
console.log('Custom script loaded!');
```

**Tehlikeli Kod Testi:**
```javascript
alert('XSS Test'); // Sanitize edilmeli
```

### Test 7.8: Toplu Ayarları Kaydetme
**Adımlar:**
1. Tüm alt tablarda değişiklik yapın
2. Her biri için "Save" butonuna tıklayın
3. Hiçbiri diğerini etkilememeli
4. Tüm değişiklikler doğru kaydedilmeli

---

## 🔄 CROSS-TAB TESTLER

### Test C1: Tab Geçişlerinde State Korunması
**Adımlar:**
1. Content tab'ında bir sayfa seçin
2. Design tab'ına geçin
3. Slider'ları değiştirin
4. Typography tab'ına geçin
5. Font ayarlarını değiştirin
6. Content tab'ına geri dönün
7. Seçili sayfa hala aynı olmalı (sessionStorage)

### Test C2: Real-time Synchronization
**Adımlar:**
1. İki browser penceresi açın
2. Her ikisinde de Site Commander'a girin
3. Birinde Design tab'ından renk değiştirin
4. Diğer pencerede otomatik güncellenmeli (Supabase realtime)

### Test C3: Undo/Redo Fonksiyonları (varsa)
**Adımlar:**
1. Bir değişiklik yapın
2. Ctrl+Z ile geri alın
3. Ctrl+Y ile tekrar yap
4. State doğru yönetilmeli

### Test C4: Conflict Resolution
**Adımlar:**
1. İki pencerede aynı kaydı açın
2. Birinde değiştirip kaydedin
3. Diğerinde de değiştirin ve kaydedin
4. Son kaydeden kazanır (optimistic locking yok)
5. Uyarı mesajı olmalı (tercihen)

---

## ⚡ PERFORMANS TESTLERİ

### Test P1: Initial Load Performance
**Adımlar:**
1. Browser Developer Tools → Network tab
2. "Disable cache" işaretleyin
3. Sayfayı yenileyin (F5)
4. Ölçümler:
   - Total load time < 3 saniye
   - Total requests < 50
   - Total size < 2MB

### Test P2: Slider Debounce Testi
**Adımlar:**
1. Design tab'ında bir slider'ı hızlıca hareket ettirin
2. Network tab'ını izleyin
3. Her milisaniyede istek atmamalı
4. 500ms debounce ile tek istek atmalı

### Test P3: Large Content Handling
**Adımlar:**
1. Content tab'ında çok uzun bir metin yazın (10000+ kelime)
2. TipTap editör donmamalı
3. Kaydetme sırasında timeout olmamalı
4. Optimize edilip kaydedilmeli

### Test P4: Image Optimization
**Adımlar:**
1. 5MB'lık bir resim yükleyin
2. Otomatik olarak optimize edilmeli mi kontrol edin
3. Thumbnail oluşturulmalı
4. Loading lazy olmalı

### Test P5: Concurrent Requests
**Adımlar:**
1. "Save All Changes" butonuna tıklayın
2. 10+ section kaydetmesi başlasın
3. İstekler paralel atılmalı (Promise.all)
4. Hepsi başarılı olmalı
5. Rate limit aşılmamalı

---

## 🐛 HATA SENARYOLARI

### Test E1: Network Hatası
**Adımlar:**
1. Developer Tools → Network tab
2. "Offline" modunu aktif edin
3. Herhangi bir değişikliği kaydetmeyi deneyin
4. Error toast görünmeli: "Network error. Please check your connection."
5. Retry mekanizması olmalı (tercihen)

### Test E2: 413 Payload Too Large
**Adımlar:**
1. Bir section'a çok büyük içerik ekleyin (>2MB)
2. Kaydetmeyi deneyin
3. Hata mesajı: "Content is too large. Please reduce the content size."
4. Öneriler gösterilmeli

### Test E3: Unauthorized Access
**Adımlar:**
1. Logout olun
2. `/admin/site-commander` URL'ine gidin
3. Login sayfasına yönlendirilmeli
4. Veya 403 Forbidden görmeli

### Test E4: Concurrent Edit Conflict
**Adımlar:**
1. Aynı kaydı iki pencerede açın
2. Birinde değiştirin, kaydedin
3. Diğerinde eski veriyi değiştirin, kaydedin
4. İkinci kayıt birincinin üzerine yazar
5. İdeal: "This record has been modified. Reload?" uyarısı

### Test E5: Geçersiz CSS
**Adımlar:**
1. Custom CSS'e syntax hatası ekleyin:
```css
.broken {
  color: ###invalid;
}
```
2. Kaydedin
3. Sayfa kırılmamalı
4. Sadece o CSS uygulanmaz

### Test E6: Missing Required Fields
**Adımlar:**
1. Banner formunda required alanları boş bırakın
2. "Save" butonuna tıklayın
3. Validation mesajları görünmeli
4. Form submit edilmemeli

### Test E7: SQL Injection Attempt
**Adımlar:**
1. Herhangi bir text alanına SQL kodu yazın:
```sql
'; DROP TABLE cms_pages; --
```
2. Kaydedin
3. RLS ve prepared statements ile korunmalı
4. SQL çalışmamalı, string olarak kaydedilmeli

### Test E8: XSS Attempt
**Adımlar:**
1. HTML içeren bir metin yazın:
```html
<script>alert('XSS')</script>
```
2. Kaydedin
3. Sayfa görüntülendiğinde sanitize edilmiş olmalı
4. Script çalışmamalı

---

## 📊 TEST SONUÇLARI RAPORU

Her test tamamlandıktan sonra doldurun:

### Content Tab
- [ ] Test 1.1: Sayfa Listesi ✅ / ❌
- [ ] Test 1.2: Sidebar Toggle ✅ / ❌
- [ ] Test 1.3: SEO Ayarları ✅ / ❌
- [ ] Test 1.4: Accordion ✅ / ❌
- [ ] Test 1.5: Field Renderer ✅ / ❌
- [ ] Test 1.6: Payload Validasyon ✅ / ❌
- [ ] Test 1.7: Preview ✅ / ❌

### Design Tab
- [ ] Test 2.1: Layout ✅ / ❌
- [ ] Test 2.2: Logo Slider ✅ / ❌
- [ ] Test 2.3: Logo Preview ✅ / ❌
- [ ] Test 2.4: Color Picker ✅ / ❌
- [ ] Test 2.5: Spacing ✅ / ❌
- [ ] Test 2.6: Visibility Toggle ✅ / ❌
- [ ] Test 2.7: Live Preview ✅ / ❌

### Typography Tab
- [ ] Test 3.1-3.12: Tüm testler ✅ / ❌

### Theme Tab
- [ ] Test 4.1-4.8: Tüm testler ✅ / ❌

### Banners Tab
- [ ] Test 5.1-5.11: Tüm testler ✅ / ❌

### Assets Tab
- [ ] Test 6.1-6.9: Tüm testler ✅ / ❌

### Advanced Tab
- [ ] Test 7.1-7.8: Tüm testler ✅ / ❌

### Cross-Tab Tests
- [ ] Test C1-C4: Tüm testler ✅ / ❌

### Performance Tests
- [ ] Test P1-P5: Tüm testler ✅ / ❌

### Error Scenarios
- [ ] Test E1-E8: Tüm testler ✅ / ❌

---

## 🎯 KRİTİK ÖNCELIKLER

Zaman kısıtlı ise önce bu testleri yapın:

### P0 - Kritik
1. Content tab'ında sayfa seçimi ve kaydetme
2. Design tab'ında renk değiştirme ve live preview
3. Banner oluşturma ve silme
4. Asset yükleme
5. Maintenance mode ON/OFF

### P1 - Yüksek Öncelik
1. Typography ayarları
2. Theme settings kaydetme
3. Section visibility toggle
4. SEO meta bilgileri

### P2 - Orta Öncelik
1. Advanced settings tüm alanlar
2. Banner sıralama
3. Asset arama ve filtreleme
4. Custom CSS

### P3 - Düşük Öncelik
1. Performans optimizasyonları
2. Edge case'ler
3. UI/UX iyileştirmeleri

---

## 📝 NOTLAR

- Her test sonrası ekran görüntüsü alın
- Bulunan hataları issue tracker'a ekleyin
- Network tab'ı sürekli açık tutun
- Console log'larını kontrol edin
- Responsive test için mobil görünüm de test edin

## 🔐 GÜVENLİK KONTROL LİSTESİ

- [ ] RLS policies aktif mi?
- [ ] SQL injection korumalı mı?
- [ ] XSS sanitization var mı?
- [ ] CSRF token kontrolü var mı?
- [ ] File upload güvenli mi?
- [ ] API rate limiting var mı?
- [ ] Admin yetkisi doğrulanıyor mu?

## ✅ TEST TAMAMLANDI

Tarih: ___________
Test Eden: ___________
Toplam Test: ___________
Başarılı: ___________
Başarısız: ___________
Başarı Oranı: ___________%
