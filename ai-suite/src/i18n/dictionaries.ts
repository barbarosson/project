export type Locale = "en" | "es" | "fr" | "de" | "zh" | "tr";

export const LOCALES: { locale: Locale; label: string }[] = [
  { locale: "en", label: "English" },
  { locale: "es", label: "Español" },
  { locale: "fr", label: "Français" },
  { locale: "de", label: "Deutsch" },
  { locale: "zh", label: "中文" },
  { locale: "tr", label: "Türkçe" },
];

type Dict = Record<string, string>;

export const DICTS: Record<Locale, Dict> = {
  en: {
    "brand.name": "isendai",
    "header.theme": "Toggle theme",
    "hero.kicker": "AI Suite for everyday communication",
    "hero.title": "Perfect Your Message Before You Hit Send.",
    "hero.subtitle":
      "Stop overthinking. Let AI transform your angry emails, write your cover letters, and fix your dating profile in seconds.",
    "hero.badge.noSubscription": "No subscription",
    "hero.badge.noSignups": "No sign-ups",
    "hero.badge.payPerUse": "Pay per use",
    "hero.badge.noStore": "We don’t store your text",

    "section.tools.title":
      "Choose a tool. Paste your text. Get a better version instantly.",
    "section.tools.subtitle":
      "Built for real life: work emails, job applications, and dating bios.",
    "tabs.corporate": "Corporate",
    "tabs.coverletter": "Cover Letter",
    "tabs.dating": "Dating Bio",

    "how.title": "How it works",
    "how.1.title": "1) Paste",
    "how.1.body": "Drop your draft, job post, or bio. No formatting needed.",
    "how.2.title": "2) Improve",
    "how.2.body": "AI rewrites with better tone, structure, and clarity.",
    "how.3.title": "3) Copy & send",
    "how.3.body": "Get a clean result with a one-click copy button.",

    "products.title": "The products (quick, punchy, effective)",
    "products.subtitle": "Short tools with one job: make you sound better, faster.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Say it firmly. Send it safely.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Tailored, ATS-friendly, interview-ready.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Less cringe. More matches.",

    "faq.q1": "Do you store my text?",
    "faq.a1":
      "No. Your input is kept in your browser (localStorage) to complete the flow.",
    "faq.q2": "How does payment work?",
    "faq.a2": "Pay per use. Secure checkout via Stripe. No subscription traps.",
    "faq.q3": "What do I get?",
    "faq.a3":
      "A polished output you can copy immediately—email, cover letter, or bio.",

    "footer.copyright": "© 2026 isendai.com. Crafted for better communication.",
    "footer.trust":
      "🔒 Secure Payments via Stripe | ⚡ Powered by AI | 🚫 We do not store your data.",

    "tool.corp.desc":
      "Want to yell at your boss or client? Don't. Type your angry, unfiltered thoughts here, and we'll turn it into a polite, HR-friendly masterpiece.",
    "tool.corp.placeholder":
      `Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`,
    "tool.corp.button": "Translate to Professional - $1.49",

    "tool.cover.desc":
      "Tired of writing the same letter for every job? Paste the job URL and your skills. We'll generate a tailored, ATS-beating cover letter that gets interviews.",
    "tool.cover.placeholder1": "Paste Job Description or URL...",
    "tool.cover.placeholder2": "Paste your resume text or key skills...",
    "tool.cover.button": "Generate Cover Letter - $1.49",

    "tool.dating.desc":
      "Not getting matches? Our AI will brutally roast your current bio, tell you exactly why it's failing, and write a magnetic new one for you.",
    "tool.dating.placeholder":
      "Paste your current Tinder/Bumble bio or describe your vibe...",
    "tool.dating.button": "Roast & Fix My Profile - $1.49",

    "success.test": "Test mode. Generating your result…",
    "success.paid": "Payment received. Generating your result…",
    "success.usingSaved": "We’re using your saved input from localStorage.",
    "success.generating": "Generating with GPT‑4o‑mini…",
    "success.copy": "Copy to Clipboard",
    "success.ready": "Ready when you are.",

    "home.sidebar.title": "AI Products",
    "home.workspace.hint": "Paste → Generate → Copy",

    "category.work-career.label": "Work & Career",
    "category.crisis-money.label": "Crisis & Money",
    "category.social-dating.label": "Social & Dating",

    // Tool labels/descriptions/actions/placeholders (used on homepage + tool cards)
    "tool.corporate-whisperer.label": "The Corporate Whisperer",
    "tool.corporate-whisperer.desc":
      "Want to yell at your boss or client? Don't. Type your angry, unfiltered thoughts here, and we'll turn it into a polite, HR-friendly masterpiece.",
    "tool.corporate-whisperer.action": "Translate to Professional",
    "tool.corporate-whisperer.placeholder.text":
      `Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`,

    "tool.coverletter-ai.label": "Click Cover Letter",
    "tool.coverletter-ai.desc":
      "Tired of writing the same letter for every job? Paste the job URL and your skills. We'll generate a tailored, ATS-beating cover letter that gets interviews.",
    "tool.coverletter-ai.action": "Generate Cover Letter",
    "tool.coverletter-ai.placeholder.jobLink": "Paste Job Description or URL...",
    "tool.coverletter-ai.placeholder.resume": "Paste your resume text or key skills...",

    "tool.dating-roast.label": "Dating Profile Roast & Fix",
    "tool.dating-roast.desc":
      "Not getting matches? Our AI will brutally roast your current bio, tell you exactly why it's failing, and write a magnetic new one for you.",
    "tool.dating-roast.action": "Roast & Fix My Profile",
    "tool.dating-roast.placeholder.text":
      "Paste your current Tinder/Bumble bio or describe your vibe...",

    "tool.raise-negotiator.label": "The Raise Negotiator",
    "tool.raise-negotiator.desc":
      "Turn your wins into a clear, persuasive raise or budget increase email that’s confident, specific, and hard to ignore.",
    "tool.raise-negotiator.action": "Write My Raise Email",
    "tool.raise-negotiator.placeholder.text":
      "Paste your achievements, impact, numbers, and context...",

    "tool.graceful-quitter.label": "The Graceful Quitter",
    "tool.graceful-quitter.desc":
      "Draft a professional resignation letter that preserves relationships and avoids burning bridges.",
    "tool.graceful-quitter.action": "Generate Resignation Letter",
    "tool.graceful-quitter.placeholder.text":
      "Role, last day, reason (optional), and any handoff notes...",

    "tool.cold-dm-icebreaker.label": "The Cold DM Icebreaker",
    "tool.cold-dm-icebreaker.desc":
      "Create a short, high-reply cold message for LinkedIn/email that feels personal, not spammy.",
    "tool.cold-dm-icebreaker.action": "Write My Cold DM",
    "tool.cold-dm-icebreaker.placeholder.text":
      "Who you’re messaging, why them, what you want, and 1–2 personal details...",

    "tool.micromanager-tamer.label": "The Micromanager Tamer",
    "tool.micromanager-tamer.desc":
      "Set firm boundaries with a micromanager—politely, clearly, and without escalating drama.",
    "tool.micromanager-tamer.action": "Set Boundaries",
    "tool.micromanager-tamer.placeholder.text":
      "Describe what they do, what you need instead, and your preferred workflow...",

    "tool.invoice-chaser.label": "The Invoice Chaser",
    "tool.invoice-chaser.desc":
      "Write a firm-but-friendly payment reminder that gets you paid without shaming the client.",
    "tool.invoice-chaser.action": "Chase My Invoice",
    "tool.invoice-chaser.placeholder.text":
      "Invoice #, amount, due date, and prior follow-ups (if any)...",

    "tool.perfect-apology.label": "The Perfect Apology",
    "tool.perfect-apology.desc":
      "A no-excuses apology that takes responsibility, repairs trust, and proposes a concrete next step.",
    "tool.perfect-apology.action": "Write My Apology",
    "tool.perfect-apology.placeholder.text":
      "What happened, who it impacted, and what you’ll do to fix it...",

    "tool.refund-demander.label": "The Refund Demander",
    "tool.refund-demander.desc":
      "A formal, assertive complaint email that cites consumer rights and maximizes your chance of a refund or compensation.",
    "tool.refund-demander.action": "Demand My Refund",
    "tool.refund-demander.placeholder.text":
      "Company, order details, issue, timeline, what you want, and any evidence...",

    "tool.deadline-diplomat.label": "The Deadline Diplomat",
    "tool.deadline-diplomat.desc":
      "Ask for more time in a way that stays credible: calm, professional, with a plan and revised timeline.",
    "tool.deadline-diplomat.action": "Request Extension",
    "tool.deadline-diplomat.placeholder.text":
      "Current deadline, what’s blocking, new proposed date, and next milestones...",

    "tool.landlord-diplomat.label": "The Landlord Diplomat",
    "tool.landlord-diplomat.desc":
      "Draft diplomatic, legally-aware messages for landlord/tenant disputes without inflaming the situation.",
    "tool.landlord-diplomat.action": "Draft My Message",
    "tool.landlord-diplomat.placeholder.text":
      "Country/city, issue (rent/repairs/deposit), what you want, and any dates...",

    "tool.review-retaliator.label": "The Review Retaliator",
    "tool.review-retaliator.desc":
      "Respond to unfair negative reviews with calm professionalism and reputation-saving clarity.",
    "tool.review-retaliator.action": "Write Review Reply",
    "tool.review-retaliator.placeholder.text":
      "Paste the review + any context you can share (facts, policy, what happened)...",

    "tool.ghosting-resurrector.label": "The Ghosting Resurrector",
    "tool.ghosting-resurrector.desc":
      "Get a reply without sounding desperate: short, playful, and low-pressure follow-ups.",
    "tool.ghosting-resurrector.action": "Get Them To Reply",
    "tool.ghosting-resurrector.placeholder.text":
      "Paste the last messages and what you want (date / clarity / closure)...",

    "tool.passive-aggressive-decoder.label": "The Passive-Aggressive Decoder",
    "tool.passive-aggressive-decoder.desc":
      "Translate toxic subtext into plain English—then craft a smart reply that disarms without escalating.",
    "tool.passive-aggressive-decoder.action": "Decode & Reply",
    "tool.passive-aggressive-decoder.placeholder.text":
      "Paste the message you received and the relationship context...",

    "tool.guilt-free-no.label": 'The Guilt-Free "No"',
    "tool.guilt-free-no.desc":
      "Say no clearly and kindly—without overexplaining or feeling guilty.",
    "tool.guilt-free-no.action": "Write My No",
    "tool.guilt-free-no.placeholder.text":
      "What you’re declining, who it is, and how direct you want to be...",

    "tool.delicate-truth.label": "The Delicate Truth",
    "tool.delicate-truth.desc":
      "Turn hard truths into gentle, non-blaming messages that still land clearly.",
    "tool.delicate-truth.action": "Say It Kindly",
    "tool.delicate-truth.placeholder.text":
      "What you need to say, why, and what outcome you want...",

    "tool.co-parenting-peacemaker.label": "The Co-Parenting Peacemaker",
    "tool.co-parenting-peacemaker.desc":
      "Filter anger and keep it logistics-only: neutral co-parenting messages that reduce conflict.",
    "tool.co-parenting-peacemaker.action": "Make It Neutral",
    "tool.co-parenting-peacemaker.placeholder.text":
      "Situation, schedule details, what you’re requesting, and boundaries...",

    "tool.friendzone-navigator.label": "The Friendzone Navigator",
    "tool.friendzone-navigator.desc":
      "Confess feelings or set boundaries without wrecking the friendship—careful, respectful, and clear.",
    "tool.friendzone-navigator.action": "Write My Message",
    "tool.friendzone-navigator.placeholder.text":
      "Context, what you feel, and what you’re asking for (or declining)...",

    "tool.rsvp-diplomat.label": "The RSVP Diplomat",
    "tool.rsvp-diplomat.desc":
      "Decline an important invitation without drama: warm, respectful, and final.",
    "tool.rsvp-diplomat.action": "Decline Gracefully",
    "tool.rsvp-diplomat.placeholder.text":
      "Event, who invited you, why you can’t go (optional), and tone preference...",
  },
  es: {
    "brand.name": "isendai",
    "header.theme": "Cambiar tema",
    "hero.kicker": "Suite de IA para comunicación diaria",
    "hero.title": "Perfecciona tu mensaje antes de enviarlo.",
    "hero.subtitle":
      "Deja de pensarlo tanto. Deja que la IA convierta tus correos enfadados, escriba cartas de presentación y mejore tu perfil de citas en segundos.",
    "hero.badge.noSubscription": "Sin suscripción",
    "hero.badge.noSignups": "Sin registro",
    "hero.badge.payPerUse": "Pago por uso",
    "hero.badge.noStore": "No guardamos tu texto",
    "section.tools.title": "Elige una herramienta. Pega tu texto. Mejora al instante.",
    "section.tools.subtitle":
      "Para la vida real: correos de trabajo, solicitudes y biografías de citas.",
    "tabs.corporate": "Corporativo",
    "tabs.coverletter": "Carta",
    "tabs.dating": "Bio",
    "how.title": "Cómo funciona",
    "how.1.title": "1) Pega",
    "how.1.body": "Pega tu borrador, oferta o bio. Sin formato.",
    "how.2.title": "2) Mejora",
    "how.2.body": "La IA reescribe con mejor tono, estructura y claridad.",
    "how.3.title": "3) Copia y envía",
    "how.3.body": "Obtén un resultado limpio con copiar en un clic.",
    "products.title": "Productos (rápidos y efectivos)",
    "products.subtitle": "Herramientas con una sola misión: sonar mejor, más rápido.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Firme, pero seguro.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "A medida, ATS, listo para entrevista.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Menos cringe. Más matches.",
    "faq.q1": "¿Guardan mi texto?",
    "faq.a1": "No. Se guarda en tu navegador (localStorage) para completar el flujo.",
    "faq.q2": "¿Cómo funciona el pago?",
    "faq.a2": "Pago por uso. Checkout seguro con Stripe. Sin trampas.",
    "faq.q3": "¿Qué recibo?",
    "faq.a3": "Un texto pulido que puedes copiar al instante.",
    "footer.copyright": "© 2026 isendai.com. Hecho para comunicar mejor.",
    "footer.trust":
      "🔒 Pagos seguros con Stripe | ⚡ Impulsado por IA | 🚫 No guardamos tus datos.",
    "tool.corp.desc":
      "¿Quieres gritarle a tu jefe o cliente? No lo hagas. Escribe lo que piensas y lo convertimos en un correo educado y apto para RR. HH.",
    "tool.corp.placeholder":
      `Escribe lo que REALMENTE quieres decir... (p. ej., "Este diseño es basura y ni leíste el brief.")`,
    "tool.corp.button": "Traducir a profesional - $1.49",
    "tool.cover.desc":
      "¿Cansado de la misma carta para cada puesto? Pega la URL/oferta y tus habilidades. Generamos una carta a medida que consigue entrevistas.",
    "tool.cover.placeholder1": "Pega la descripción o URL del trabajo...",
    "tool.cover.placeholder2": "Pega tu CV o habilidades clave...",
    "tool.cover.button": "Generar carta - $1.49",
    "tool.dating.desc":
      "¿Pocos matches? La IA critica tu bio, te dice por qué falla y escribe una nueva y magnética.",
    "tool.dating.placeholder": "Pega tu bio de Tinder/Bumble o describe tu vibra...",
    "tool.dating.button": "Roast y arreglar - $1.49",
    "success.test": "Modo test. Generando…",
    "success.paid": "Pago recibido. Generando…",
    "success.usingSaved": "Usamos tu texto guardado en localStorage.",
    "success.generating": "Generando con GPT‑4o‑mini…",
    "success.copy": "Copiar",
    "success.ready": "Listo cuando tú lo estés.",
  },
  fr: {
    "brand.name": "isendai",
    "header.theme": "Changer le thème",
    "hero.kicker": "Suite IA pour la communication au quotidien",
    "hero.title": "Peaufinez votre message avant d’appuyer sur Envoyer.",
    "hero.subtitle":
      "Arrêtez de trop réfléchir. L’IA transforme vos emails énervés, écrit vos lettres de motivation et améliore votre bio en quelques secondes.",
    "hero.badge.noSubscription": "Sans abonnement",
    "hero.badge.noSignups": "Sans inscription",
    "hero.badge.payPerUse": "Paiement à l’usage",
    "hero.badge.noStore": "Nous ne stockons pas votre texte",
    "section.tools.title": "Choisissez un outil. Collez votre texte. Améliorez instantanément.",
    "section.tools.subtitle":
      "Pour la vraie vie : emails pro, candidatures, bios de rencontre.",
    "tabs.corporate": "Corporate",
    "tabs.coverletter": "Lettre",
    "tabs.dating": "Bio",
    "how.title": "Comment ça marche",
    "how.1.title": "1) Collez",
    "how.1.body": "Collez votre brouillon, offre ou bio. Sans mise en forme.",
    "how.2.title": "2) Améliorez",
    "how.2.body": "L’IA réécrit avec meilleur ton, structure et clarté.",
    "how.3.title": "3) Copiez & envoyez",
    "how.3.body": "Résultat propre avec copie en un clic.",
    "products.title": "Produits (rapides, efficaces)",
    "products.subtitle": "Des outils simples : mieux écrire, plus vite.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Ferme. Sûr. Pro.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Sur-mesure, ATS, prêt entretien.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Moins cringe. Plus de matchs.",
    "faq.q1": "Stockez-vous mon texte ?",
    "faq.a1": "Non. Il reste dans votre navigateur (localStorage) pour terminer le flux.",
    "faq.q2": "Comment fonctionne le paiement ?",
    "faq.a2": "Paiement à l’usage. Paiement sécurisé via Stripe. Pas de pièges.",
    "faq.q3": "Qu’est-ce que je reçois ?",
    "faq.a3": "Un texte peaufiné que vous pouvez copier immédiatement.",
    "footer.copyright": "© 2026 isendai.com. Conçu pour mieux communiquer.",
    "footer.trust":
      "🔒 Paiements sécurisés via Stripe | ⚡ Propulsé par l’IA | 🚫 Nous ne stockons pas vos données.",
    "tool.corp.desc":
      "Envie de crier sur votre boss ou client ? Ne le faites pas. Écrivez tout, on le transforme en email poli et OK RH.",
    "tool.corp.placeholder":
      `Tapez ce que vous voulez VRAIMENT dire... (ex. "Ce design est nul et vous n’avez pas lu le brief.")`,
    "tool.corp.button": "Traduire en pro - $1.49",
    "tool.cover.desc":
      "Marre de la même lettre ? Collez l’URL/offre et vos compétences. On génère une lettre ciblée qui décroche des entretiens.",
    "tool.cover.placeholder1": "Collez l’offre ou l’URL...",
    "tool.cover.placeholder2": "Collez votre CV ou compétences clés...",
    "tool.cover.button": "Générer la lettre - $1.49",
    "tool.dating.desc":
      "Pas assez de matchs ? L’IA roast votre bio, explique pourquoi ça bloque, puis écrit une nouvelle bio magnétique.",
    "tool.dating.placeholder": "Collez votre bio Tinder/Bumble ou décrivez votre vibe...",
    "tool.dating.button": "Roast & corriger - $1.49",
    "success.test": "Mode test. Génération…",
    "success.paid": "Paiement reçu. Génération…",
    "success.usingSaved": "Nous utilisons votre texte sauvegardé (localStorage).",
    "success.generating": "Génération avec GPT‑4o‑mini…",
    "success.copy": "Copier",
    "success.ready": "Quand vous voulez.",
  },
  de: {
    "brand.name": "isendai",
    "header.theme": "Theme wechseln",
    "hero.kicker": "KI‑Suite für tägliche Kommunikation",
    "hero.title": "Perfektioniere deine Nachricht, bevor du auf Senden klickst.",
    "hero.subtitle":
      "Hör auf zu grübeln. KI verwandelt wütende Mails, schreibt Anschreiben und optimiert dein Dating‑Profil in Sekunden.",
    "hero.badge.noSubscription": "Kein Abo",
    "hero.badge.noSignups": "Kein Signup",
    "hero.badge.payPerUse": "Pay‑per‑use",
    "hero.badge.noStore": "Wir speichern deinen Text nicht",
    "section.tools.title":
      "Tool wählen. Text einfügen. Sofort eine bessere Version erhalten.",
    "section.tools.subtitle":
      "Fürs echte Leben: Business‑Mails, Bewerbungen und Dating‑Bios.",
    "tabs.corporate": "Business",
    "tabs.coverletter": "Anschreiben",
    "tabs.dating": "Dating‑Bio",
    "how.title": "So funktioniert’s",
    "how.1.title": "1) Einfügen",
    "how.1.body": "Entwurf, Jobpost oder Bio einfügen. Kein Format nötig.",
    "how.2.title": "2) Verbessern",
    "how.2.body": "KI schreibt mit besserem Ton, Struktur und Klarheit um.",
    "how.3.title": "3) Kopieren & senden",
    "how.3.body": "Sauberes Ergebnis mit Copy‑Button.",
    "products.title": "Produkte (kurz, knackig, effektiv)",
    "products.subtitle": "Tools mit einem Ziel: besser klingen – schneller.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Klar sagen. Sicher senden.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Passgenau. ATS‑ready. Interview‑ready.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Weniger cringe. Mehr Matches.",
    "faq.q1": "Speichert ihr meinen Text?",
    "faq.a1": "Nein. Er bleibt in deinem Browser (localStorage) für den Flow.",
    "faq.q2": "Wie funktioniert die Zahlung?",
    "faq.a2": "Pay‑per‑use. Sicher via Stripe. Kein Abo‑Trick.",
    "faq.q3": "Was bekomme ich?",
    "faq.a3": "Einen polierten Text zum sofortigen Kopieren.",
    "footer.copyright": "© 2026 isendai.com. Für bessere Kommunikation.",
    "footer.trust":
      "🔒 Sichere Zahlungen via Stripe | ⚡ Powered by AI | 🚫 Wir speichern deine Daten nicht.",
    "tool.corp.desc":
      "Du willst deinen Chef/Client anschreien? Tu’s nicht. Schreib’s hier rein – wir machen daraus eine höfliche, HR‑taugliche Mail.",
    "tool.corp.placeholder":
      `Schreib, was du WIRKLICH sagen willst... (z. B. "Dieses Design ist Müll und du hast mein Briefing nicht gelesen.")`,
    "tool.corp.button": "Professionell umschreiben - $1.49",
    "tool.cover.desc":
      "Keine Lust auf Copy‑Paste‑Anschreiben? Job‑URL und Skills einfügen – wir generieren ein passendes, ATS‑starkes Anschreiben.",
    "tool.cover.placeholder1": "Jobbeschreibung oder URL einfügen...",
    "tool.cover.placeholder2": "Lebenslauf oder Skills einfügen...",
    "tool.cover.button": "Anschreiben generieren - $1.49",
    "tool.dating.desc":
      "Zu wenig Matches? KI roastet deine Bio, sagt dir warum’s nicht klappt, und schreibt eine neue, magnetische Version.",
    "tool.dating.placeholder": "Tinder/Bumble Bio einfügen oder deinen Vibe beschreiben...",
    "tool.dating.button": "Roast & Fix - $1.49",
    "success.test": "Testmodus. Generiere…",
    "success.paid": "Zahlung erhalten. Generiere…",
    "success.usingSaved": "Wir nutzen deinen gespeicherten Input (localStorage).",
    "success.generating": "Generiere mit GPT‑4o‑mini…",
    "success.copy": "Kopieren",
    "success.ready": "Bereit, wenn du es bist.",
  },
  zh: {
    "brand.name": "isendai",
    "header.theme": "切换主题",
    "hero.kicker": "日常沟通 AI 套件",
    "hero.title": "在你点击发送前，把话说得更漂亮。",
    "hero.subtitle":
      "别再纠结了。让 AI 秒级优化你的情绪邮件、求职信和约会简介。",
    "hero.badge.noSubscription": "无需订阅",
    "hero.badge.noSignups": "无需注册",
    "hero.badge.payPerUse": "按次付费",
    "hero.badge.noStore": "不保存你的文本",
    "section.tools.title": "选工具，粘贴文本，立刻得到更好的版本。",
    "section.tools.subtitle": "适用于工作邮件、求职申请与约会简介。",
    "tabs.corporate": "职场",
    "tabs.coverletter": "求职信",
    "tabs.dating": "约会简介",
    "how.title": "如何使用",
    "how.1.title": "1) 粘贴",
    "how.1.body": "粘贴草稿、职位描述或简介，无需格式。",
    "how.2.title": "2) 优化",
    "how.2.body": "AI 提升语气、结构与清晰度。",
    "how.3.title": "3) 复制发送",
    "how.3.body": "一键复制，直接发送。",
    "products.title": "产品（快速、好用、有效）",
    "products.subtitle": "每个工具只做一件事：让你更会说话。",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "强硬但得体。",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "定制、ATS 友好、面试加分。",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "少尴尬，多匹配。",
    "faq.q1": "会保存我的文本吗？",
    "faq.a1": "不会。文本仅保存在你的浏览器（localStorage）以完成流程。",
    "faq.q2": "支付如何进行？",
    "faq.a2": "按次付费。Stripe 安全支付。没有订阅套路。",
    "faq.q3": "我会得到什么？",
    "faq.a3": "可立即复制的优化结果：邮件/求职信/简介。",
    "footer.copyright": "© 2026 isendai.com. 为更好的沟通而生。",
    "footer.trust": "🔒 Stripe 安全支付 | ⚡ AI 驱动 | 🚫 不存储你的数据",
    "tool.corp.desc":
      "想对老板/客户发火？别。把真实想法写下来，我们帮你变成礼貌、HR 友好的邮件。",
    "tool.corp.placeholder":
      `写下你“真正”想说的话…（例如：“这个设计太烂了，你根本没看 brief。”）`,
    "tool.corp.button": "改写成职场语气 - $1.49",
    "tool.cover.desc":
      "厌倦每次都写一遍？粘贴职位 URL/描述和你的技能，我们生成定制的求职信。",
    "tool.cover.placeholder1": "粘贴职位描述或 URL…",
    "tool.cover.placeholder2": "粘贴简历内容或关键技能…",
    "tool.cover.button": "生成求职信 - $1.49",
    "tool.dating.desc":
      "匹配太少？AI 会吐槽你的简介、指出问题，并给你一版更有吸引力的新简介。",
    "tool.dating.placeholder": "粘贴你的 Tinder/Bumble 简介或描述你的风格…",
    "tool.dating.button": "吐槽并修复 - $1.49",
    "success.test": "测试模式：生成中…",
    "success.paid": "支付成功：生成中…",
    "success.usingSaved": "正在使用你在 localStorage 中保存的输入。",
    "success.generating": "使用 GPT‑4o‑mini 生成中…",
    "success.copy": "复制",
    "success.ready": "准备就绪。",
  },
  tr: {
    "brand.name": "isendai",
    "header.theme": "Tema değiştir",
    "hero.kicker": "Günlük iletişim için AI Suite",
    "hero.title": "Göndermeden önce mesajını mükemmelleştir.",
    "hero.subtitle":
      "Fazla düşünmeyi bırak. AI; öfkeli e-postalarını kurumsallaştırır, ön yazını yazar, flört biyonu saniyelerde parlatır.",
    "hero.badge.noSubscription": "Abonelik yok",
    "hero.badge.noSignups": "Kayıt yok",
    "hero.badge.payPerUse": "Kullandıkça öde",
    "hero.badge.noStore": "Metnini saklamayız",
    "section.tools.title":
      "Aracını seç. Metni yapıştır. Daha iyi versiyonu anında al.",
    "section.tools.subtitle":
      "Gerçek hayat için: iş e-postaları, iş başvuruları ve flört biyoları.",
    "tabs.corporate": "Kurumsal",
    "tabs.coverletter": "Ön yazı",
    "tabs.dating": "Flört biyo",
    "how.title": "Nasıl çalışır?",
    "how.1.title": "1) Yapıştır",
    "how.1.body": "Taslağını, ilan metnini veya biyonu yapıştır. Format şart değil.",
    "how.2.title": "2) İyileştir",
    "how.2.body": "AI tonu, yapıyı ve netliği güçlendirerek yeniden yazar.",
    "how.3.title": "3) Kopyala & gönder",
    "how.3.body": "Tek tıkla kopyala, direkt gönder.",
    "products.title": "Ürünler (hızlı, net, etkili)",
    "products.subtitle": "Tek işi var: daha iyi görünmeni sağlamak.",
    "products.corp.title": "The Corporate Whisperer",
    "products.corp.slogan": "Sert söyle. Güvenli gönder.",
    "products.cover.title": "1-Click Cover Letter",
    "products.cover.slogan": "Özel, ATS uyumlu, mülakat odaklı.",
    "products.dating.title": "Dating Profile Roast & Fix",
    "products.dating.slogan": "Daha az cringe. Daha çok match.",
    "faq.q1": "Metnimi saklıyor musunuz?",
    "faq.a1": "Hayır. Akışı tamamlamak için tarayıcında (localStorage) tutulur.",
    "faq.q2": "Ödeme nasıl çalışıyor?",
    "faq.a2": "Kullandıkça öde. Stripe ile güvenli ödeme. Abonelik tuzağı yok.",
    "faq.q3": "Ne elde edeceğim?",
    "faq.a3": "Hemen kopyalayabileceğin parlatılmış bir çıktı.",
    "footer.copyright": "© 2026 isendai.com. Daha iyi iletişim için üretildi.",
    "footer.trust":
      "🔒 Stripe ile güvenli ödeme | ⚡ AI destekli | 🚫 Verini saklamayız.",
    "tool.corp.desc":
      "Patronuna/müşterine bağırmak mı istiyorsun? Sakın. Buraya yaz; biz de kibar, HR-dostu bir e-postaya çevirelim.",
    "tool.corp.placeholder":
      `GERÇEKTEN söylemek istediğini yaz... (örn. "Bu tasarım berbat ve brief’i hiç okumamışsın.")`,
    "tool.corp.button": "Kurumsala çevir - $1.49",
    "tool.cover.desc":
      "Her ilana aynı ön yazıyı yazmaktan yoruldun mu? İlan URL/metnini ve becerilerini yapıştır. Özel bir ön yazı üretelim.",
    "tool.cover.placeholder1": "İlan metni veya URL yapıştır...",
    "tool.cover.placeholder2": "CV metnini veya ana becerilerini yapıştır...",
    "tool.cover.button": "Ön yazı üret - $1.49",
    "tool.dating.desc":
      "Match yok mu? AI biyonu roastlar, neden olmadığını söyler ve daha çekici bir biyo yazar.",
    "tool.dating.placeholder": "Tinder/Bumble biyonu yapıştır ya da tarzını anlat...",
    "tool.dating.button": "Roastla & düzelt - $1.49",
    "success.test": "Test modu. Sonuç hazırlanıyor…",
    "success.paid": "Ödeme alındı. Sonuç hazırlanıyor…",
    "success.usingSaved": "localStorage’daki kaydını kullanıyoruz.",
    "success.generating": "GPT‑4o‑mini ile üretiliyor…",
    "success.copy": "Kopyala",
    "success.ready": "Hazır olduğunda.",

    "home.sidebar.title": "AI Ürünleri",
    "home.workspace.hint": "Yapıştır → Üret → Kopyala",

    "category.work-career.label": "İş & Kariyer",
    "category.crisis-money.label": "Kriz & Para",
    "category.social-dating.label": "Sosyal & Flört",

    "tool.corporate-whisperer.label": "Kurumsal Çevirmen",
    "tool.corporate-whisperer.desc":
      "Patronuna ya da müşterine bağırmak mı istiyorsun? Sakın. Buraya filtresiz yaz; biz de kibar, HR‑dostu kurumsal e-postaya çevirelim.",
    "tool.corporate-whisperer.action": "Kurumsala Çevir",
    "tool.corporate-whisperer.placeholder.text":
      `GERÇEKTEN söylemek istediğini yaz... (örn. "Bu tasarım berbat ve brief’i hiç okumamışsın.")`,

    "tool.coverletter-ai.label": "Tek Tık Ön Yazı",
    "tool.coverletter-ai.desc":
      "Her ilana aynı metni yazmaktan yoruldun mu? İlan URL/metnini ve becerilerini yapıştır; ATS uyumlu, özelleştirilmiş bir ön yazı üretelim.",
    "tool.coverletter-ai.action": "Ön Yazı Üret",
    "tool.coverletter-ai.placeholder.jobLink": "İlan metni veya URL yapıştır...",
    "tool.coverletter-ai.placeholder.resume": "CV metnini veya ana becerilerini yapıştır...",

    "tool.dating-roast.label": "Flört Biyosu Roast & Fix",
    "tool.dating-roast.desc":
      "Match yok mu? AI biyonu roastlar, neden işlemediğini söyler ve daha çekici bir versiyon yazar.",
    "tool.dating-roast.action": "Roastla & Düzelt",
    "tool.dating-roast.placeholder.text": "Tinder/Bumble biyonu yapıştır ya da tarzını anlat...",

    "tool.raise-negotiator.label": "Zam Müzakerecisi",
    "tool.raise-negotiator.desc":
      "Başarılarını net bir etkiye çevirip ikna edici bir zam/bütçe artışı e-postasına dönüştürür.",
    "tool.raise-negotiator.action": "Zam E-postası Yaz",
    "tool.raise-negotiator.placeholder.text": "Başarıların, sayılar, etki, sorumluluk ve bağlamı yaz/yapıştır...",

    "tool.graceful-quitter.label": "Nazik İstifacı",
    "tool.graceful-quitter.desc":
      "Köprüleri yakmadan, profesyonel ve kısa bir istifa mektubu hazırlar.",
    "tool.graceful-quitter.action": "İstifa Mektubu Üret",
    "tool.graceful-quitter.placeholder.text": "Pozisyon, son gün, (opsiyonel) sebep ve devir planı...",

    "tool.cold-dm-icebreaker.label": "Soğuk DM Buzkıran",
    "tool.cold-dm-icebreaker.desc":
      "LinkedIn/e‑posta için spam gibi durmayan, kişiselleştirilmiş ve cevap alma ihtimali yüksek kısa mesaj üretir.",
    "tool.cold-dm-icebreaker.action": "Cold DM Yaz",
    "tool.cold-dm-icebreaker.placeholder.text": "Kime yazıyorsun, neden, ne istiyorsun, kişisel detay (varsa)...",

    "tool.micromanager-tamer.label": "Mikro Yönetici Terbiyecisi",
    "tool.micromanager-tamer.desc":
      "Sürekli karışan yönetici/müşteriye nazik ama net sınır çizen mesaj üretir.",
    "tool.micromanager-tamer.action": "Sınır Koy",
    "tool.micromanager-tamer.placeholder.text": "Ne yapıyor, sen ne istiyorsun, ideal çalışma düzenin...",

    "tool.invoice-chaser.label": "Fatura Kovalayıcı",
    "tool.invoice-chaser.desc":
      "Utandırmadan, profesyonel şekilde gecikmiş ödemeyi hatırlatan e-posta yazar.",
    "tool.invoice-chaser.action": "Faturayı Hatırlat",
    "tool.invoice-chaser.placeholder.text": "Fatura no, tutar, vade, önceki takipler (varsa)...",

    "tool.perfect-apology.label": "Mükemmel Özür",
    "tool.perfect-apology.desc":
      "Bahane üretmeyen, sorumluluk alan ve çözüm sunan güçlü bir özür metni yazar.",
    "tool.perfect-apology.action": "Özür Metni Yaz",
    "tool.perfect-apology.placeholder.text": "Ne oldu, kimi etkiledi, nasıl telafi edeceksin...",

    "tool.refund-demander.label": "İade Talepçisi",
    "tool.refund-demander.desc":
      "Tüketici haklarına atıf yapan, resmi ve kararlı bir iade/tazminat e-postası yazar.",
    "tool.refund-demander.action": "İade Talep Et",
    "tool.refund-demander.placeholder.text": "Firma, sipariş detayları, sorun, tarihçe, talebin, kanıt (varsa)...",

    "tool.deadline-diplomat.label": "Deadline Diplomatı",
    "tool.deadline-diplomat.desc":
      "Güven vererek ek süre isteyen, planlı ve profesyonel mesaj üretir.",
    "tool.deadline-diplomat.action": "Ek Süre İste",
    "tool.deadline-diplomat.placeholder.text": "Mevcut deadline, engeller, önerilen yeni tarih, plan/milestone...",

    "tool.landlord-diplomat.label": "Ev Sahibi Diplomatı",
    "tool.landlord-diplomat.desc":
      "Ev sahibi/kiracı anlaşmazlıklarında diplomatik, yasal çerçeveye dikkat eden mesaj üretir.",
    "tool.landlord-diplomat.action": "Mesajı Yaz",
    "tool.landlord-diplomat.placeholder.text": "Şehir/ülke, konu (kira/tamir/depozito), talebin, tarihler...",

    "tool.review-retaliator.label": "Yorum Savunucusu",
    "tool.review-retaliator.desc":
      "Haksız kötü yorumlara sakin, profesyonel ve itibar koruyan cevaplar yazar.",
    "tool.review-retaliator.action": "Yorum Cevabı Yaz",
    "tool.review-retaliator.placeholder.text": "Yorumu yapıştır + olay/politika/faktlar (varsa)...",

    "tool.ghosting-resurrector.label": "Ghosting Diriltici",
    "tool.ghosting-resurrector.desc":
      "Darlamadan cevap aldıracak kısa, düşük baskılı follow-up mesajları üretir.",
    "tool.ghosting-resurrector.action": "Cevap Aldır",
    "tool.ghosting-resurrector.placeholder.text": "Son mesajları yapıştır + ne istiyorsun (buluşma/netlik/kapanış)...",

    "tool.passive-aggressive-decoder.label": "İmalı Mesaj Çözücü",
    "tool.passive-aggressive-decoder.desc":
      "İmalı/toksik alt metni çözümler ve karşı tarafı silahsız bırakan akıllı cevaplar üretir.",
    "tool.passive-aggressive-decoder.action": "Çözümle & Yanıtla",
    "tool.passive-aggressive-decoder.placeholder.text": "Gelen mesaj + ilişki/bağlam...",

    "tool.guilt-free-no.label": "Vicdan Azabı Olmadan “Hayır”",
    "tool.guilt-free-no.desc":
      "Net ama kibar şekilde reddetmeni sağlar; fazla açıklama yapmadan.",
    "tool.guilt-free-no.action": "Nazikçe Reddet",
    "tool.guilt-free-no.placeholder.text": "Neyi reddediyorsun, kim, ne kadar direkt olsun...",

    "tool.delicate-truth.label": "Nazik Gerçek",
    "tool.delicate-truth.desc":
      "Söylemesi zor gerçekleri suçlamadan, nazik bir yüzleşme metnine çevirir.",
    "tool.delicate-truth.action": "Nazikleştir",
    "tool.delicate-truth.placeholder.text": "Ne söylemek istiyorsun, neden, beklediğin sonuç...",

    "tool.co-parenting-peacemaker.label": "Ortak Ebeveyn Barıştırıcısı",
    "tool.co-parenting-peacemaker.desc":
      "Öfkeyi filtreleyip sadece lojistik ve nötr iletişim kurmanı sağlayan mesaj üretir.",
    "tool.co-parenting-peacemaker.action": "Nötrleştir",
    "tool.co-parenting-peacemaker.placeholder.text": "Durum, takvim/saatler, talebin, sınırlar...",

    "tool.friendzone-navigator.label": "Friendzone Navigatörü",
    "tool.friendzone-navigator.desc":
      "Duygularını açarken ya da reddederken arkadaşlığı mahvetmeyen dikkatli mesaj yazar.",
    "tool.friendzone-navigator.action": "Mesajı Yaz",
    "tool.friendzone-navigator.placeholder.text": "Bağlam, ne hissediyorsun, ne istiyorsun/istemiyorsun...",

    "tool.rsvp-diplomat.label": "RSVP Diplomatı",
    "tool.rsvp-diplomat.desc":
      "Önemli bir etkinliğe gidemeyeceğini dram yaratmadan açıklayan sıcak ve net bir mazeret metni yazar.",
    "tool.rsvp-diplomat.action": "Kibarca İptal Et",
    "tool.rsvp-diplomat.placeholder.text": "Etkinlik, davet eden kişi, sebep (opsiyonel), ton tercihi...",
  },
};

