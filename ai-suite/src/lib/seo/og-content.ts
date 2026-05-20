import type { Locale } from "@/i18n/dictionaries";

export type OgCopy = {
  alt: string;
  headline: string;
  subline: string;
  chips: [string, string, string];
};

export const OG_COPY: Record<Locale, OgCopy> = {
  en: {
    alt: "isendai — Don't send that yet",
    headline: "Don't Send That Yet.",
    subline: "Paste the chaos. Get a message you'd actually hit send on.",
    chips: ["Rage email fix", "Cover letter glow-up", "Dating bio rescue"],
  },
  tr: {
    alt: "isendai — Henüz gönderme",
    headline: "Henüz Gönderme.",
    subline: "Karmakarışık metni yapıştır. Göndermeye cesaret edeceğin hale gelsin.",
    chips: ["Öfke maili fix", "Ön yazı glow-up", "Dating bio kurtarma"],
  },
  es: {
    alt: "isendai — Aún no envíes",
    headline: "No lo envíes todavía.",
    subline: "Pega el caos. Recibe un mensaje que sí enviarías.",
    chips: ["Email enfadado", "Carta de presentación", "Bio dating"],
  },
  fr: {
    alt: "isendai — N'envoyez pas encore",
    headline: "N'envoyez pas ça tout de suite.",
    subline: "Collez le bazar. Repartez avec un message prêt à envoyer.",
    chips: ["Mail rage", "Lettre de motivation", "Bio dating"],
  },
  de: {
    alt: "isendai — Noch nicht absenden",
    headline: "Noch nicht absenden.",
    subline: "Chaos einfügen. Sendefertige Nachricht rausbekommen.",
    chips: ["Wut-Mail", "Anschreiben", "Dating-Bio"],
  },
  zh: {
    alt: "isendai — 先别发送",
    headline: "先别发送。",
    subline: "粘贴乱七八糟的草稿，得到真正敢发出去的内容。",
    chips: ["火药味邮件", "求职信", "交友简介"],
  },
};
