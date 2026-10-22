BAYİ OTOMATİK FATURALAMA
Proje Planı ve Teknik Tasarım Dokümanı
ICTREQ-19500 | Workpackage: ICTWP-XXXXX
Kaynak Analiz: Bayi Otomatik faturalama analiz dokümanı (3)
PO Referans: Manual TDM PO Template (tüm sheetler incelendi)
Platform: Oracle EBS (Hakediş ve ilişkili ekranlar)
Doküman Tarihi: 22.10.2026 (Europe/Istanbul)
Hazırlayan: Barbaros Songur / Teknik Tasarım

Bu doküman; mevcut analiz dokümanı ve manuel PO Excel şablonu incelenerek hazırlanmış uygulama proje planıdır. Hakediş yükleme, süreç takip, kart mapping, ATF/PO, 136 hesap mutabakatı ve Paycell/BYS/IDM entegrasyonları teknik seviyede ele alınmıştır.
# 1. Yönetici Özeti
Bayi personeline yapılan kampanya hakediş ödemeleri ve faturalama süreçleri bugün manuel yürütülmekte; operasyonel hata ve uzun mutabakat süreleri oluşmaktadır. Proje ile kampanya personel listesinin sisteme yüklenmesinden itibaren tüm süreç “domino taşı” etkisiyle otomatize edilecek; Paycell, BYS, IDM ve Oracle EBS entegre çalışacaktır.
Hedef çıktılar:
Manuel Excel/veri taşıma işlemlerinin sonlandırılması
Marka bazlı ATF ve bayi bazlı PO’nun Oracle EBS üzerinde otomatik üretimi
136 hesap takibi, eksi dekont ve bakiye iade süreçlerinin sistemsel güvence altına alınması
Personel bilgilendirme (BiP/SMS) ve mutabakat raporlarının standartlaştırılması
# 2. Kapsam ve Sınırlar
## 2.1 Kapsam İçinde
Oracle EBS üzerinde hakediş ve ilişkili ekranlar (yükleme, takip, kart mapping, onay)
Otomatik ATF oluşturma ve ayrı ödeme grubunda yönetim
Bayi bazlı PO oluşturma (Manual TDM PO Template alan modeli baz alınarak)
BYS/IDM personel aktiflik ve bayi kod eşleşmesi
Paycell NTS kart / KYC kontrolü, bakiye sorgu, ödeme tetikleme ve kampanya sonu iade
136 hesap muhasebe kayıtları ve mutabakat raporları
Cashstation dekont bilgisi entegrasyonu (fizibilite sonrası)
## 2.2 Kapsam Dışı / Varsayımlar
Mevcut faturalama düzeninin vergi/hukuk onayı ile korunması
Yeni bayi tipi tanımları — Dealer_Type listesi parametrik olarak genişletilebilir
Cashstation kesinleşene kadar dekont yükleme manuel fallback ile desteklenebilir
# 3. Mevcut Durum ve Hedef Mimari
## 3.1 Mevcut Durum (As-Is)
Kampanya listesi Excel ile hazırlanır
PO oluşturma Manual TDM PO Template ile yapılır; dosya “Atilacaklar” klasörüne taşınır
ATF, ödeme dağıtımı, 136 mutabakatı ve iade adımları parçalı / manuel ilerler
Mutabakat farkları ve uzun kapanış süreleri oluşur
## 3.2 Hedef Durum (To-Be) — Domino Akışı
1. Satış/Ticari Pazarlama kampanya listesini (GSM, TCKN, Tutar) Oracle EBS Hakediş Yükleme ekranından yükler
2. Sistem BYS/IDM ile personel aktifliği ve bayi kod eşleşmesini doğrular
3. Paycell ile kart ve KYC durumu sorgulanır; hatalı kayıtlar raporlanır
4. Onaylı liste ile marka/kampanya bazlı ATF oluşturulur
5. ATF onayı sonrası tutar Paycell NTS kartlarına aktarılır
6. Banka dekontu (Cashstation / sistem) geldiğinde bireysel ödemeler otomatik başlar
7. Başarılı ödemeler kadar bayi bazlı fatura/dekont ile 136 hesap alacaklandırılır
8. Kalan tutar için eksi dekont + NTS kalan bakiye iadesi ile hesap kapatılır
9. Personel BiP/SMS ile “Ekip Adı: Kampanya Adı” formatında bilgilendirilir
## 3.3 Sistem Entegrasyon Haritası

# 4. Oracle EBS Ekranları (Hakediş ve İlişkili)
Kullanıcı arayüzü ve süreç yönetimi Oracle EBS üzerinde konumlandırılacaktır.
## 4.1 Hakediş Yükleme Ekranı
Amaç: Kampanya personel listesinin güvenli şekilde sisteme alınması ve validasyon tetiklenmesi.
Alanlar: Kampanya Adı, Kampanya/Event Tarihi, Marka (Turkcell/SOL), Ekip Adı, Dosya seçimi (xlsx/csv)
Beklenen satır alanları: GSM, TCKN, Tutar (KDV’siz), Bayi Kodu (CODE_COLLABORATEUR), opsiyonel açıklama
Validasyonlar: zorunlu alan, TCKN format, tutar > 0, mükerrer TCKN-Tutar-Tarih kontrolü
İşlem: Staging tabloya yükle → Concurrent ile BYS/IDM + Paycell kontrollerini çalıştır → sonuç grid
Teknik: XX_BOF_HAKEDIS_HDR / XX_BOF_HAKEDIS_LN; XXBOF_UPLOAD concurrent
## 4.2 Süreç Takip Ekranı
Amaç: ATF, Paycell bakiye, dekont ve ödeme durumunun uçtan uca izlenmesi.
Gösterimler: ATF No / Statü, Toplam Tutar, Ödenen / Kalan, 136 bakiye, Paycell kart bakiyesi
Aksiyonlar: Onaya gönder, ATF oluştur, Dekont görüntüle, Ödeme tetikle (onaylı), İade başlat
Filtreler: Kampanya, tarih aralığı, marka, bayi tipi, statü
Teknik: Status machine (DRAFT → VALIDATED → PENDING_APPROVAL → ATF_CREATED → FUNDED → PAYING → RECONCILED → CLOSED)
## 4.3 Kart Mapping Ekranı
Amaç: Şirket (Turkcell/SOL) ve kampanya türüne göre kullanılacak NTS kartlarının eşleştirilmesi.
Alanlar: Şirket, Kampanya Türü / Marka, NTS Kart Ref (maskeli gösterim), Aktif mi, Geçerlilik tarihi
Kaynak: İş birimlerinden kurumsal kart listesi
Teknik: XX_BOF_CARD_MAP; ATF öncesi bakiye sorgu bu mapping üzerinden yapılır
## 4.4 Onay ve Hiyerarşi / Parametreler
Oracle EBS AME veya mevcut onay hiyerarşi kodları (ONAY_HIYERARSISI) kullanılır
Haftalık ödeme takvimi: Perşembe; Aralık’ta Salı-Perşembe (parametrik takvim tablosu)
Finans onaycısı: ATF sonrası / ödeme tetikleme öncesi ayrı onay adımı
## 4.5 Rapor Ekranları
Ödeme Durum Raporu: personel bazlı başarılı/başarısız yükleme detayı
Muhasebe Mutabakat Raporu: 136 borç/alacak ve kalan bakiye; kart ve kampanya segment kırılımı
Kampanya bazlı pivot çıktı (BI / Concurrent Excel)
# 5. Manuel PO Şablonu Analizi (Bilgi Amaçlı)
Copy of Manual_TDM_PO_Template.xlsx dosyasının tüm sheetleri incelenmiştir. Otomatik PO üretimi bu alan modelini Oracle EBS API/interface katmanına taşıyacaktır.
## 5.1 Sheet Özeti

## 5.2 Data Sheet — Kolon Sözlüğü

## 5.3 Dealer_Type Lookup
FLAGSHIP, ALTERNATİF, ZİNCİR, TIM, KÇM, GLOBAL, MİGROS, DİSTRİBÜTÖR, TSN-YTSN, TDM, SEKTÖR DIŞI
Örnek Data sheet’inde 733 satırın tamamı DEALER_TYPE=TIM. Sistemde bu liste lookup olarak tutulmalı; VENDOR_ID / VENDOR_SITE_ID eksikse Oracle AP vendor master’dan tamamlanmalıdır.
## 5.4 Onay_Hiyerarsisi Sheet

Açık nokta: Örnek Data satırlarında ONAY_HIYERARSISI=339 kullanılmıştır; Onay_Hiyerarsisi sheet’inde 339 kodu yer almamaktadır. Mapping tablosuna eksik kodların eklenmesi gerekir.
## 5.5 Şablon Operasyon Kuralları
Dosya ve kolon isimleri kesinlikle değiştirilmemeli
Manual template dosyası “Atilacaklar” klasörüne TAŞINMALI (kopyalanmamalı)
PO_NAME alanı excelde tek isim olmalı
AMOUNT_KDVSIZ kesir ayracı nokta; küsürat ayracı kullanılmaz
Otomasyonda interface tablo kolon adları sabit tutulacak; dosya taşıma yerine Oracle Purchasing PO Create API / custom concurrent ile doğrudan PO üretilecek.
## 5.6 Örnek Veri Profili

Not: Min tutar 0 görülen satırlar validasyon kuralında (tutar > 0) reddedilmeli.
# 6. Fonksiyonel Gereksinimler

# 7. Teknik Tasarım Detayları
## 7.1 Önerilen Veri Modeli

## 7.2 136 Hesap Mantığı
ATF tutarı → 136 hesaba borç
Paycell’den başarılı ödeme listesi kadar bayi bazlı fatura/dekont → 136 alacak
Kalan tutar → eksi dekont ile 136 kapatma
Kampanya sonu NTS kalan bakiye → Turkcell hesaplarına otomatik iade
Segment detayları Ayşim Tuncer’den alınacak; INVOICE_GROUP string’i buna göre üretilecek
Örnek invoice group: 01-136.01.01.01.01.003-0-0-KA52-0-0-0-0-0-0-0-0-0-0
## 7.3 ATF ve PO Otomasyonu
Ayrı bir ödeme grubu tanımlanır — diğer AP akışlarından izole
ATF: marka/kampanya bazlı ödeme belgesi
PO: bayi (VENDOR_ID + VENDOR_SITE_ID + CODE_COLLABORATEUR) bazında üretim
Kaynak mapping: XX_BOF_PO_IFACE ← Manual TDM PO Template kolonları
API adayları: PO_HEADERS_INTERFACE / PO_LINES_INTERFACE + Purchasing Import; veya XXBOF_PO_PKG
Onay: ONAY_HIYERARSISI kodu AME / existing hierarchy’ye map edilir
## 7.4 Paycell Entegrasyon Servisleri

Teknik notlar: timeout/retry, idempotency key (campaign_id + tckn + amount + event_date), PII maskeleme, audit trail zorunlu.
## 7.5 BYS / IDM Entegrasyonu
Personel aktif mi?
Bayi kodu (CODE_COLLABORATEUR) eşleşiyor mu?
Vendor/site eksikse ERP AP vendor master tamamlaması
Ön görüşme: Adnan Yılmaz (BYS)
## 7.6 Bildirim Motoru
Şablon: “{Ekip Adı}: {Kampanya Adı}”
Kanal: BiP ve/veya SMS
İçerikte maskeli kart bilgisi; açık PAN yasak
Tetik: ödeme başarılı / başarısız / iade
## 7.7 Concurrent Program / Job Tasarımı

## 7.8 Güvenlik ve Uyum
Maskeli kart numarası gönderimi
TCKN ve kart verisi encryption-at-rest / role based access
EBS responsibility ayrımı: Yükleyici / Onaycı / Muhasebe / Admin
Vergi uyumu: PO açılış zamanlaması mevcut faturalama düzenini bozmamalı
# 8. Proje Fazları ve İş Kırılımı (WBS)
Fazlar ardışık bağımlılıklarla ilerler; her fazın çıkış kriteri bir sonraki faza giriş koşuludur.
## Faz 0 — Keşif ve Netleştirme
Cashstation dekont otomasyonu fizibilitesi (Sarper Bey)
BYS veri erişim modeli (Adnan Yılmaz)
Paycell servis kontratları: balance, pay, refund (Serhat Mercan / PSR)
Onay hiyerarşi kodlarının tam listesi (339 ve eksikler)
136 segment dictionary (Ayşim Tuncer)
Haftalık nakit akış onayı ve Aralık çift gün takvimi
Çıkış: Entegrasyon sözleşmeleri + alan mapping onaylı
## Faz 1 — Oracle EBS Temel Altyapı
Custom tablolar, sequence, index, audit kolonları
Lookup’lar: Dealer_Type, Hierarchy, Brand, Status
Hakediş Yükleme ekranı + staging + validasyon framework
Kart Mapping ekranı
Çıkış: Liste yüklenebilir; validasyon raporu üretilir (mock ile)
## Faz 2 — ATF / PO / 136 Motoru
ATF oluşturma + ayrı payment group
PO interface (Manual template field-parity) + Purchasing import
136 borç / alacak / eksi dekont muhasebe paketleri
Süreç Takip ekranı (statü makinesi)
Çıkış: UAT’ta örnek kampanya ile ATF+PO+136 borç oluşur
## Faz 3 — Paycell & Dekont Entegrasyonu
KYC/kart, balance, fund, pay, refund servis client’ları
Cashstation veya manuel dekont fallback
Ödeme tetikleme onay mekanizması
Çıkış: Dekont sonrası uçtan uca ödeme happy-path
## Faz 4 — Bildirim, Rapor, Mutabakat
BiP/SMS motoru ve açıklama standardı
Ödeme durum + 136 mutabakat + kampanya pivot raporları
Kapanış/iade otomatizasyonu
Çıkış: Kampanya kapanışında 136 = 0 ve iade kanıtı
## Faz 5 — UAT, Eğitim, Canlıya Geçiş
Senaryo bazlı UAT (TIM örnek data seti ile regression)
Kullanıcı eğitimi (Satış, Finans, Muhasebe)
Cutover: paralel koşu (manuel template vs otomatik)
Hypercare ve CFP güncelleme
# 9. Rol ve Sorumluluklar (RACI Özeti)

# 10. Test Stratejisi
## 10.1 Test Türleri
Birim: validasyon kuralları, tutar aggregasyonu, invoice group builder
Entegrasyon: BYS/IDM, Paycell (sandbox), PO import, GL 136
Uçtan uca: yükleme → ATF → fund → dekont → ödeme → mutabakat → iade
Negatif: KYC fail, mükerrer kayıt, tutar 0, eksik vendor site, dekont gecikmesi
Güvenlik: maskeleme, yetki matrisi, log’da PII kontrolü
Regresyon: Manual TDM PO Template ile üretilen PO alan parity karşılaştırması
## 10.2 Örnek Uçtan Uca Senaryo
Girdi: TIM_OCAK 2026 örnek setinden örneklenmiş N satır
Beklenen: tek ATF (marka), N bayi PO/satır, 136 borç = toplam, ödemeler sonrası kalan için eksi dekont
Bildirim: başarılı personele maskeli kart + standart açıklama
# 11. Riskler, Bağımlılıklar ve Açık Konular

# 12. AD Checklist Durumu

# 13. Teslimatlar (Deliverables)
Bu Proje Planı ve Teknik Tasarım Dokümanı
Süreç akış şeması ve ekran vizyon sunumu
Entegrasyon mapping dokümanı (PO template ↔ EBS interface ↔ Paycell)
Oracle EBS ekranları + concurrent paketleri
UAT test senaryoları ve sonuç tutanağı
Canlıya geçiş / rollback planı
CFP toplamları (teknik geliştirme aşamasında doldurulacak)
# 14. Sonuç ve Sonraki Adımlar
Proje, Oracle EBS merkezli hakediş ekranları ile Paycell/BYS/IDM entegrasyonunu birleştirerek kampanya ödemelerini uçtan uca otomatize etmeyi hedefler. Manuel TDM PO Template alan modeli otomatik PO üretiminin referans sözleşmesidir; kolon isimleri ve iş kuralları korunacaktır.
Öncelikli sonraki adımlar:
Faz 0 bağımlılıklarını kapat (Cashstation, BYS, Paycell kontrat, hiyerarşi 339, 136 segment)
Ekran wireframe / vizyon sunumunu paydaş onayına çıkar
XX_BOF_* veri modeli ve PO interface DDL taslağını review’a aç
TIM örnek dataset ile sandboxed uçtan uca prototip
— Doküman Sonu —