import type { ToolName } from "@/components/ai-suite/tools";
import type { Locale } from "@/i18n/dictionaries";

type LocalizedLine = { en: string; tr: string };

export type ComicSidebarExample = {
  tool: ToolName;
  before: LocalizedLine;
  after: LocalizedLine;
};

/** Min canvas height (xl) so short pages spread gutter bubbles like the home page. */
export const COMIC_GUTTER_CANVAS_MIN_HEIGHT = "max(100%, 5200px)";
export const COMIC_SIDEBAR_EXAMPLES: ComicSidebarExample[] = [
  {
    tool: "corporate-whisperer",
    before: {
      en: "Your deck is a mess. Fix it tonight or don’t bother showing up.",
      tr: "Sunumunuz berbat. Bu gece düzeltin yoksa gelmeyin.",
    },
    after: {
      en: "I’d appreciate a tighter narrative in the deck before tomorrow—happy to pair on slides if helpful.",
      tr: "Yarın öncesi sunumda daha net bir anlatı olursa sevinirim; isterseniz slaytlara birlikte bakalım.",
    },
  },
  {
    tool: "graceful-quitter",
    before: {
      en: "I’m out Monday. Don’t call me.",
      tr: "Pazartesi gelmiyorum. Aramayın.",
    },
    after: {
      en: "Hi [Name]—I’m resigning effective [date]. Thank you for the trust; I’ll document handoffs this week.",
      tr: "Merhaba [İsim]—[tarih] itibarıyla ayrılıyorum. Güveniniz için teşekkürler; bu hafta devir notlarını paylaşırım.",
    },
  },
  {
    tool: "corporate-to-caveman-translator",
    before: {
      en: "We should align stakeholders and revisit bandwidth next sprint.",
      tr: "Paydaşları hizalayalım, kapasiteyi gelecek sprintte tekrar ele alalım.",
    },
    after: {
      en: "Talk later. Too much now.",
      tr: "Sonra konuş. Şimdi çok.",
    },
  },
  {
    tool: "dating-roast",
    before: {
      en: "Just ask me anything lol I love tacos and Netflix",
      tr: "Ne sorarsan sor lol taco ve dizi severim",
    },
    after: {
      en: "Weekend cook + long walks; ask me about the last city I got lost in on purpose.",
      tr: "Hafta sonu mutfak + uzun yürüyüşler; kasıtlı kaybolduğum son şehri sor.",
    },
  },
  {
    tool: "awkward-text-fixer",
    before: {
      en: "Sorry for double texting!!! Did u hate the movie or r u just busy???",
      tr: "Üst üste yazdığım için özür!!! Film mi kötüydü yoksa meşgul müsün???",
    },
    after: {
      en: "No rush to reply—when you’re free, curious what you thought of the film.",
      tr: "Acele yok—müsait olunca filmin hakkında ne düşündüğünü merak ettim.",
    },
  },
  {
    tool: "perfect-apology",
    before: {
      en: "Sorry sorry sorry my bad forgot again ugh",
      tr: "Özür özür benim hatam yine unuttum of",
    },
    after: {
      en: "I’m sorry I missed the deadline. I own the slip and will send the file by 5pm today.",
      tr: "Son tarihi kaçırdığım için özür dilerim. Sorumluluğu alıyorum; dosyayı bugün 17:00’ye kadar ileteceğim.",
    },
  },
  {
    tool: "passive-aggressive-decoder",
    before: {
      en: "Per my last email, as previously discussed…",
      tr: "Son e-postama göre, daha önce konuştuğumuz gibi…",
    },
    after: {
      en: "Subtext: “I already answered this—please read what I sent.”",
      tr: "Alt metin: “Bunu zaten yazdım—lütfen gönderdiğimi okuyun.”",
    },
  },
  {
    tool: "invoice-chaser",
    before: {
      en: "Pay me NOW. Third reminder!!!",
      tr: "Parayı HEMEN yatırın. Üçüncü hatırlatma!!!",
    },
    after: {
      en: "Friendly reminder: invoice #1842 was due on the 1st—could you confirm payment timing?",
      tr: "Hatırlatma: #1842 numaralı fatura ayın 1’inde vadesi doldu—ödeme tarihini teyit edebilir misiniz?",
    },
  },
  {
    tool: "ghosting-resurrector",
    before: {
      en: "??? hello??? u still alive???",
      tr: "??? merhaba??? hâlâ hayatta mısın???",
    },
    after: {
      en: "Hope your week’s going well—still up for coffee next week, or should I circle back later?",
      tr: "Umarım haftan iyidir—gelecek hafta kahve hâlâ uygunsa haber ver, değilse sonra yazarım.",
    },
  },
  {
    tool: "raise-negotiator",
    before: {
      en: "I do everything here. Pay me more or I walk.",
      tr: "Burada her şeyi ben yapıyorum. Zam yoksa giderim.",
    },
    after: {
      en: "Based on scope growth and Q results, I’d like to discuss adjusting my compensation to reflect impact.",
      tr: "Kapsam artışı ve çeyrek sonuçlarına göre etkiyi yansıtan bir ücret güncellemesi konuşmak isterim.",
    },
  },
  {
    tool: "cold-dm-icebreaker",
    before: {
      en: "Hey!!! Loved your post!!! Can we hop on a call???",
      tr: "Selam!!! Paylaşımını çok beğendim!!! Görüşelim mi???",
    },
    after: {
      en: "Your post on async standups resonated—open to a 15‑min swap of notes if useful.",
      tr: "Asenkron standup yazınız çok iyi oturdu—isterseniz 15 dk not alışverişi yapabiliriz.",
    },
  },
  {
    tool: "refund-demander",
    before: {
      en: "This product is SCAM. Refund me or I chargeback.",
      tr: "Bu ürün DOLANDIRICILIK. İade yoksa chargeback.",
    },
    after: {
      en: "The item arrived damaged on [date]. Please issue a refund to the original payment method.",
      tr: "Ürün [tarih] hasarlı geldi. Lütfen ödemeyi orijinal yönteme iade edin.",
    },
  },
  {
    tool: "micromanager-tamer",
    before: {
      en: "Stop pinging me every hour!!!",
      tr: "Saat başı yazmayı kesin!!!",
    },
    after: {
      en: "I’ll post EOD updates in Slack; for urgent blockers, tag me and I’ll respond within the hour.",
      tr: "Gün sonu güncellemelerini Slack’te paylaşırım; acil engeller için etiketleyin, bir saat içinde dönerim.",
    },
  },
  {
    tool: "deadline-diplomat",
    before: {
      en: "Can’t finish. Not my problem.",
      tr: "Yetişmez. Benim derdim değil.",
    },
    after: {
      en: "To hit quality, I need the draft by Thursday—can we shift launch to Monday or trim scope?",
      tr: "Kalite için taslağa Perşembe lazım—lansmanı Pazartesi’ye alabilir miyiz ya da kapsamı daraltalım mı?",
    },
  },
  {
    tool: "guilt-free-no",
    before: {
      en: "Ugh fine I’ll do it even though I’m drowning",
      tr: "Tamam yaparım ama boğuluyorum zaten",
    },
    after: {
      en: "Thanks for thinking of me—I can’t take this on this month; try [Name] who has bandwidth.",
      tr: "Düşündüğün için teşekkürler—bu ay alamam; kapasitesi olan [İsim]’e sorabilirsin.",
    },
  },
  {
    tool: "coverletter-ai",
    before: {
      en: "Hire me. I need job. I work hard.",
      tr: "Beni işe alın. İş lazım. Çok çalışırım.",
    },
    after: {
      en: "I shipped [metric] at [Company] and want to bring that rigor to your [Role] team.",
      tr: "[Şirket]’te [metrik] sonuç ürettim; aynı disiplini [Rol] ekibinize taşımak istiyorum.",
    },
  },
];

export function comicSidebarLine(
  line: LocalizedLine,
  locale: Locale
): string {
  return locale === "tr" ? line.tr : line.en;
}
