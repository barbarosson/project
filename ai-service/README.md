# Modulus ERP - AI Cash Flow Prediction Service

Gelişmiş AI destekli nakit akışı tahminleme servisi. Machine Learning modelleri, kural motoru ve otomatik görevler ile nakit akışını tahmin edin.

## Özellikler

- **ML Tabanlı Tahminler**: Gradient Boosting algoritması ile yüksek doğruluklu tahminler
- **Çoklu Senaryo Analizi**: Kötümser, gerçekçi, iyimser senaryolar
- **Dinamik Kural Motoru**: Pazaryeri gecikmeleri, mevsimsel faktörler, ödeme vadeleri
- **Otomatik Eğitim**: Günlük model eğitimi ve saatlik tahmin güncellemeleri
- **Risk Analizi**: Kritik günleri önceden tespit edin
- **Aksiyon Önerileri**: AI destekli finansal öneriler

## Teknolojiler

- **FastAPI**: Modern, hızlı Python web framework
- **PostgreSQL/Supabase**: Veritabanı
- **Scikit-learn**: Machine Learning
- **Pandas & NumPy**: Veri işleme
- **APScheduler**: Otomatik görevler
- **Docker**: Konteynerizasyon

## Kurulum

### 1. Gereksinimler

- Python 3.11+
- Docker & Docker Compose
- Supabase hesabı (veya PostgreSQL)

### 2. Veritabanı Migrasyonu

Veritabanı migration'ları zaten Supabase'e uygulanmış durumda. Şu tablolar oluşturuldu:

- `cash_flow_rules`: Dinamik kurallar
- `cash_flow_predictions`: AI tahminleri
- `ai_model_metrics`: Model performans metrikleri
- `production_bom`: Üretim reçeteleri (Bill of Materials)

### 3. Ortam Değişkenleri

\`.env\` dosyası oluşturun:

\`\`\`bash
cp .env.example .env
\`\`\`

\`.env\` dosyasını düzenleyin:

\`\`\`env
# Supabase Connection String
DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT].supabase.co:5432/postgres
\`\`\`

**Supabase Connection String Bulma:**
1. Supabase Dashboard'a gidin
2. Project Settings > Database
3. Connection String (Pooler) seçeneğinden \`URI\` kopyalayın
4. \`[YOUR-PASSWORD]\` yerine veritabanı şifrenizi yazın

### 4. Docker ile Çalıştırma (Önerilen)

\`\`\`bash
cd ai-service

# Servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f

# Servisleri durdur
docker-compose down
\`\`\`

Servisler:
- **AI Service**: http://localhost:8000
- **Scheduler**: Arka planda çalışır
- **API Docs**: http://localhost:8000/docs

### 5. Manuel Kurulum (Alternatif)

\`\`\`bash
cd ai-service

# Virtual environment oluştur
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Bağımlılıkları yükle
pip install -r requirements.txt

# API servisini başlat
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Scheduler'ı başlat (başka terminal)
python scheduler.py
\`\`\`

## API Kullanımı

### Health Check

\`\`\`bash
curl http://localhost:8000/health
\`\`\`

### Nakit Akış Tahmini

\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/cash-flow/predict?tenant_id=YOUR_TENANT_ID&forecast_days=30&scenario=realistic"
\`\`\`

### Model Eğitimi

\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/cash-flow/train?tenant_id=YOUR_TENANT_ID&force_retrain=true"
\`\`\`

### Senaryo Karşılaştırması

\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/cash-flow/scenarios?tenant_id=YOUR_TENANT_ID&forecast_days=30"
\`\`\`

### Pazaryeri Kuralı Oluşturma

\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/rules/marketplace-delay?tenant_id=YOUR_TENANT_ID&marketplace_name=Trendyol&delay_days=7&confidence_factor=0.85"
\`\`\`

### Mevsimsel Kural Oluşturma

\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/rules/seasonal?tenant_id=YOUR_TENANT_ID&name=Yılbaşı Kampanyası&start_date=2024-12-15&end_date=2025-01-05&adjustment_factor=1.3"
\`\`\`

## Frontend Entegrasyonu

### Next.js Projesine Ekleme

1. **Environment Variable Ekleyin** (`.env.local`):

\`\`\`env
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
\`\`\`

2. **API Client Kullanın**:

\`\`\`typescript
import { aiCashFlowClient } from '@/lib/ai-cash-flow-client';

// Tahmin al
const predictions = await aiCashFlowClient.predictCashFlow({
  tenant_id: 'your-tenant-id',
  forecast_days: 30,
  scenario: 'realistic'
});

// Senaryoları karşılaştır
const scenarios = await aiCashFlowClient.getScenarioComparison({
  tenant_id: 'your-tenant-id',
  forecast_days: 30
});
\`\`\`

3. **Component Kullanın**:

\`\`\`tsx
import { AICashFlowPredictions } from '@/components/ai-cash-flow-predictions';

export default function FinancePage() {
  return (
    <div>
      <AICashFlowPredictions />
    </div>
  );
}
\`\`\`

## Otomatik Görevler

Scheduler servisi şu görevleri otomatik olarak çalıştırır:

### Gece Eğitimi (02:00)
- Tüm tenant'lar için model eğitimi
- Son 12 ay verisi kullanılır
- Minimum 100 veri noktası gerekir

### Saatlik Güncelleme (Her Saat Başı)
- Aktif tenant'lar için tahmin güncelleme
- Bekleyen işlemler analiz edilir
- Risk seviyeleri güncellenir

## Model Performansı

Model şu metrikleri takip eder:

- **Accuracy Score**: ±3 gün içinde doğru tahmin oranı
- **MAE** (Mean Absolute Error): Ortalama mutlak hata
- **RMSE** (Root Mean Squared Error): Kök ortalama kare hatası

**Tipik Performans:**
- Accuracy: %85-95
- MAE: 2-4 gün
- RMSE: 3-6 gün

## Kural Tipleri

### 1. Marketplace Delay (Pazaryeri Gecikmesi)
Pazaryeri ödemelerinin gecikmesini modelleyin.

**Örnek:**
\`\`\`json
{
  "rule_type": "marketplace_delay",
  "conditions": {
    "marketplace_prefix": "TRY",
    "delay_days": 7
  },
  "adjustment_factor": 0.85
}
\`\`\`

### 2. Seasonal Factor (Mevsimsel Faktör)
Kampanya dönemleri, tatiller için özel ayarlar.

**Örnek:**
\`\`\`json
{
  "rule_type": "seasonal_factor",
  "conditions": {
    "start_date": "2024-11-15",
    "end_date": "2024-12-31"
  },
  "adjustment_factor": 1.2
}
\`\`\`

### 3. Payment Term (Ödeme Vadesi)
Uzun vadeli ödemeler için risk ayarı.

**Örnek:**
\`\`\`json
{
  "rule_type": "payment_term",
  "conditions": {
    "term_days": 60
  },
  "adjustment_factor": 0.8
}
\`\`\`

## Senaryo Tipleri

### Pessimistic (Kötümser)
- Girişler %20 azalır
- Çıkışlar %10 artar
- 7 gün gecikme varsayımı

### Realistic (Gerçekçi)
- Normal akış
- Mevcut verilerle tahmin

### Optimistic (İyimser)
- Girişler %15 artar
- Çıkışlar %10 azalır
- 3 gün erken tahsilat

## Troubleshooting

### Servis Başlamıyor

\`\`\`bash
# Logları kontrol edin
docker-compose logs ai-service

# Database bağlantısını test edin
docker-compose exec ai-service python -c "import asyncpg; print('OK')"
\`\`\`

### Model Eğitimi Başarısız

**Neden:** Yetersiz veri (< 100 kayıt)

**Çözüm:**
- En az 3 aylık geçmiş veri ekleyin
- \`status = 'cleared'\` kayıtları artırın

### Tahminler Yanlış

**Neden:** Güncel olmayan model

**Çözüm:**
\`\`\`bash
curl -X POST "http://localhost:8000/api/ai/cash-flow/train?tenant_id=YOUR_ID&force_retrain=true"
\`\`\`

## Production Deployment

### Docker Deployment

\`\`\`bash
# Image build
docker build -t modulus-ai-service .

# Run
docker run -d \\
  -p 8000:8000 \\
  -e DATABASE_URL=your_connection_string \\
  --name modulus-ai \\
  modulus-ai-service
\`\`\`

### Kubernetes Deployment

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: modulus-ai-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: modulus-ai
  template:
    metadata:
      labels:
        app: modulus-ai
    spec:
      containers:
      - name: ai-service
        image: modulus-ai-service:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connection-string
\`\`\`

### Health Checks

\`\`\`yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 5
\`\`\`

## Güvenlik

- API anahtarları environment variable olarak saklanmalı
- Production'da HTTPS kullanın
- Rate limiting ekleyin (nginx/traefik ile)
- Database connection string'i şifreleyin

## Lisans

Private - Modulus ERP

## Destek

- Dokümantasyon: `/docs` endpoint
- API Explorer: http://localhost:8000/docs
