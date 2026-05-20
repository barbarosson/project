/** Turkish legal body for Terms when locale is `tr`. */
import { LegalSupportContact } from "@/components/legal/legal-support-contact";

export function TermsTrBody() {
  return (
    <section className="mt-8 space-y-4 text-sm leading-relaxed text-slate-200">
      <p>
        isendai&apos;yi kullanarak bu Şartları kabul etmiş olursunuz. Kabul etmiyorsanız hizmeti
        kullanmayınız.
      </p>

      <h2 className="text-base font-semibold text-white">Hizmet</h2>
      <p>
        isendai, yapay zeka destekli metin üretimi ve yeniden yazma araçları sunar. Çıktılar otomatik
        oluşturulur ve hata içerebilir. Bir sonucu kullanmadan veya göndermeden önce incelemek ve
        doğrulamak sizin sorumluluğunuzdadır.
      </p>

      <h2 className="text-base font-semibold text-white">Kullanıcı içeriği ve gizlilik</h2>
      <p>
        Gönderdiğiniz metin üzerindeki haklarınızı korursunuz. Metninizi sonuç üretmek için işleriz;
        geçmişinize ve sürümlere cihazlar arasında erişebilmeniz için girdilerinizi ve çıktılarınızı
        saklayabiliriz. Gerekmedikçe hassas kişisel veri göndermemeniz gerekir.
      </p>

      <h2 className="text-base font-semibold text-white">Ödemeler</h2>
      <p>
        Hizmet tek seferlik kontör paketleri ve aboneliklerle sunulabilir. Ödemeler Lemon Squeezy
        üzerinden işlenir. Tam kart bilgilerinizi saklamayız. Ücretler, kanunun gerektirdiği
        durumlar dışında iade edilmeyebilir.
      </p>

      <h2 className="text-base font-semibold text-white">Kabul edilebilir kullanım</h2>
      <p>
        Hizmeti yasadışı içerik üretmek, başkalarına taciz veya iftira atmak ya da yürürlükteki
        mevzuata aykırı davranmak için kullanamazsınız. Hizmetin kötüye kullanıldığına makul şekilde
        inanırsak erişimi kısıtlayabiliriz.
      </p>

      <h2 className="text-base font-semibold text-white">Sorumluluk reddi</h2>
      <p>
        Hizmet &quot;olduğu gibi&quot; sunulur; herhangi bir garanti verilmez. Çıktıların doğru,
        eksiksiz veya belirli bir amaç için uygun olacağı garanti edilmez.
      </p>

      <h2 className="text-base font-semibold text-white">Sorumluluğun sınırlandırılması</h2>
      <p>
        Kanunun izin verdiği azami ölçüde, isendai; hizmeti kullanımınızdan doğan dolaylı, arızi,
        özel, sonuç olarak ortaya çıkan veya cezai zararlar ile kâr veya gelir kaybından sorumlu
        tutulamaz.
      </p>

      <h2 className="text-base font-semibold text-white">İletişim</h2>
      <LegalSupportContact />
    </section>
  );
}
