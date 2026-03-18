import { LegalPageShell } from '@/components/legal-page-shell'

export default function ShippingReturnsPage() {
  return (
    <LegalPageShell>
      <main className="space-y-12 text-sm leading-relaxed text-slate-700">
        <section id="iptal-iade">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            İptal ve İade Şartları
          </h1>
          <p className="mt-4 text-base font-semibold text-slate-800">
            İptal, İade ve Cayma Hakkı Bildirimi
          </p>
          <p className="mt-4">
            Modulusaas, bulut tabanlı bir ERP yazılım hizmeti (SaaS) sunduğu için iade süreçleri dijital
            hizmet standartlarına tabidir:
          </p>
          <ul className="mt-6 list-disc space-y-4 pl-5">
            <li>
              <strong>Ücretsiz Deneme:</strong> Tüm kullanıcılarımıza sunduğumuz 14 günlük ücretsiz
              kullanım süresi boyunca sistemi hiçbir ücret ödemeden tüm özellikleriyle test
              edebilirsiniz.
            </li>
            <li>
              <strong>Abonelik İptali:</strong> Aylık veya yıllık aboneliklerinizi dilediğiniz zaman panel
              üzerinden iptal edebilirsiniz. İptal işlemi, içinde bulunulan fatura döneminin sonunda geçerli
              olur; o döneme ait ücret iadesi yapılmaz ancak bir sonraki dönem için kartınızdan çekim
              yapılmaz.
            </li>
            <li>
              <strong>Cayma Hakkı:</strong> Mesafeli Sözleşmeler Yönetmeliği uyarınca &quot;elektronik ortamda
              anında ifa edilen hizmetler&quot; cayma hakkının istisnası kapsamındadır. Ancak, teknik bir
              aksaklık nedeniyle hizmetin vaat edilen şekilde sunulamaması durumunda, ödeme tarihinden
              itibaren 7 gün içinde yapılan başvurular Songurtech tarafından incelenerek iade süreci
              başlatılabilir.
            </li>
            <li>
              <strong>Geri Ödeme:</strong> İade kararı verilen işlemler, ödemenin yapıldığı karta iyzico
              aracılığıyla iade edilir. İadenin ekstrenize yansıma süresi bankanıza bağlı olarak 2-10 iş
              günü sürebilir.
            </li>
          </ul>
        </section>

        <section id="teslimat">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Teslimat Politikası
          </h2>
          <p className="mt-4 text-base font-semibold text-slate-800">Hizmet Teslimat Şartları</p>
          <ul className="mt-6 list-disc space-y-4 pl-5">
            <li>
              <strong>Teslimat Şekli:</strong> Modulusaas bir yazılım hizmetidir (SaaS), fiziksel bir ürün
              sevkiyatı veya kargo gönderimi yapılmaz.
            </li>
            <li>
              <strong>Teslimat Süresi:</strong> Kayıt işlemi veya ödeme onayının hemen ardından, sisteme
              giriş bilgileriniz beyan ettiğiniz e-posta adresine anlık olarak iletilir ve hesabınız aktif
              edilir.
            </li>
            <li>
              <strong>Erişim Sorunları:</strong> Giriş bilgilerinin ulaşmaması veya teknik bir sorun
              yaşanması durumunda,{' '}
              <a href="mailto:info@modulustech.app" className="text-sky-700 underline hover:text-sky-900">
                info@modulustech.app
              </a>{' '}
              adresine bildirimde bulunabilirsiniz. Destek ekibimiz en kısa sürede erişiminizi sağlayacaktır.
            </li>
          </ul>
        </section>
      </main>
    </LegalPageShell>
  )
}
