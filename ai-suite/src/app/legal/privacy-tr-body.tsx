/** Turkish legal body for Privacy when locale is `tr`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function PrivacyTrBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        isendai, sağladığınız metni dönüştürmenize yardımcı olur (örneğin mesaj taslağı, yeniden
        yazma veya iletişim şablonları üretme).
      </p>

      <h2 className="text-base font-semibold text-white">Topladıklarımız</h2>
      <p>
        Yalnızca hizmeti sunmak için gerekli bilgileri toplarız: gönderdiğiniz metin ve güvenlik ile
        performans izleme için temel teknik veriler (tarayıcı türü, IP&apos;den türetilen yaklaşık
        konum, zaman damgaları gibi).
      </p>

      <h2 className="text-base font-semibold text-white">Metninizi nasıl kullanır ve saklarız</h2>
      <p>
        Gönderdiğiniz metin, sonucunuzu üretmek için <strong>yalnızca işleme sırasında</strong>{" "}
        kullanılır. Geçmişinize, sürümlere ve kontör bakiyenize cihazlar arasında erişebilmeniz için
        gönderdiğiniz metni ve üretilen çıktıları da saklayabiliriz.
      </p>
      <p>
        Hesabınızı silerek veya destekle iletişime geçerek saklanan içeriğin silinmesini
        talep edebilirsiniz. Yasal ve operasyonel gerekliliklere tabi olarak, talep edilen verileri
        makul bir süre içinde silmeyi hedefleriz.
      </p>

      <h2 className="text-base font-semibold text-white">Ödemeler</h2>
      <p>
        Ödemeler Lemon Squeezy tarafından işlenir. Tam kart bilgilerinizi saklamayız. Lemon Squeezy,
        kendi politikalarına göre ödeme bilgilerini toplayabilir ve işleyebilir.
      </p>

      <h2 className="text-base font-semibold text-white">Üçüncü taraf işleyiciler</h2>
      <p>
        Çıktı üretmek için girdi metninizi yalnızca işleme amacıyla AI sağlayıcılarına (OpenAI,
        Anthropic, Groq, DeepSeek veya Google gibi) gönderebiliriz. Bu sağlayıcılar, üretim
        isteği için hizmet işleyicisi olarak hareket eder.
      </p>

      <h2 className="text-base font-semibold text-white">Güvenlik</h2>
      <p>
        Hizmeti korumak ve yetkisiz erişim veya kötüye kullanım riskini azaltmak için makul teknik
        ve organizasyonel önlemler kullanırız.
      </p>

      <h2 className="text-base font-semibold text-white">İletişim</h2>
      <LegalSupportContact />
    </section>
  );
}
