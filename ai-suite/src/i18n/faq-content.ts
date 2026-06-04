import type { Locale } from "@/i18n/dictionaries";
import { faqSupportAnswers } from "@/lib/faq-support";

export type FaqItem = { question: string; answer: string };

export type FaqPageContent = {
  title: string;
  intro: string;
  metaDescription: string;
  items: FaqItem[];
};

export const FAQ_CONTENT: Record<Locale, FaqPageContent> = {
  en: {
    title: "Frequently Asked Questions",
    intro:
      "Quick answers about isendai: credits, AI models, privacy, payments, and how to get the most from your generations.",
    metaDescription:
      "FAQ for isendai: credits, AI tiers, billing, privacy, tools, sharing, and support.",
    items: [
      {
        question: "What is isendai?",
        answer:
          "isendai is an AI writing suite for everyday communication. It helps you draft, rewrite, and polish messages for email, work, social media, dating profiles, and more — before you hit send.",
      },
      {
        question: "Do I need a subscription?",
        answer:
          "No subscription is required. You can buy one-time credit packs or choose an optional monthly or yearly plan. You must sign in and have enough credits in your balance for each generation; usage is deducted by AI tier and input length. New members receive 100 welcome credits once after completing membership profile and email verification (one time per account). Purchases go through Lemon Squeezy when checkout is enabled in your environment (see Pricing).",
      },
      {
        question: "How do credits work?",
        answer:
          "Credits are your balance for running AI generations. When you generate text, credits are deducted automatically. You can top up via paid packs (Lemon Squeezy) or, in non-production environments, through developer top-up options described on Pricing.",
      },
      {
        question: "What are Fast AI, Pro AI, and Genius AI?",
        answer:
          "These are user-facing quality tiers — not technical model names. Fast AI uses efficient models for quick, low-cost drafts. Pro AI balances quality and speed for most tasks. Genius AI uses our strongest models for complex or high-stakes writing.",
      },
      {
        question: "How are credits charged per generation?",
        answer:
          "Billing uses 100-character blocks of your input text. Economy (Fast) tier costs 0.2 credits per block, Standard (Pro) costs 3 credits per block, and Premium (Genius) costs 5 credits per block. Fractional amounts are supported (e.g. 0.2 credits).",
      },
      {
        question: "Is my text stored?",
        answer:
          "Your input is processed to produce results. We may also store inputs and outputs so you can access history, versions, and credits across devices. Avoid submitting sensitive personal data unless necessary. See our Privacy Policy for deletion options.",
      },
      {
        question: "Which AI providers does isendai use?",
        answer:
          "Requests may be routed across providers such as OpenAI, Anthropic, Groq, DeepSeek, and Google depending on the tool and tier you select. Providers process your text only to fulfill the generation request.",
      },
      {
        question: "How do I sign in?",
        answer:
          "Use Sign in on the site with your email or supported OAuth providers (e.g. Google). After sign-in, your credit balance and generation history sync to your account.",
      },
      {
        question: "Is there a free trial?",
        answer:
          "Eligible users may unlock a first free generation on a device before purchasing credits. Promotions and trial rules can change; check the home page or Pricing for current offers.",
      },
      {
        question: "What tools are available?",
        answer:
          "The suite includes many specialized tools — email writers, LinkedIn posts, cover letters, replies, tone adjustments, dating bios, and more. Browse categories on the home page or open a tool directly from the sidebar.",
      },
      {
        question: "Can I generate alternative versions?",
        answer:
          "Yes. After a result is ready, you can request alternative versions (up to a per-generation limit) with optional extra instructions, and switch between saved versions on the results screen.",
      },
      {
        question: "How do payments work?",
        answer:
          "Payments are processed by Lemon Squeezy as Merchant of Record. We do not store your full card details. Refund rules follow Lemon Squeezy and applicable law; see Terms of Service for details.",
      },
      {
        question: "Can I share results on social media?",
        answer:
          "Yes. On the results screen you can copy text, share to X, LinkedIn, Facebook, Instagram, or TikTok (clipboard + open platform), or download a share image for Instagram and TikTok.",
      },
      {
        question: "What if I run out of credits or generation fails?",
        answer:
          "If your balance is too low, you will be prompted to visit Pricing or sign in. For errors, wait a moment and retry. Persistent issues may be rate limits or provider outages — contact support via your purchase receipt if needed.",
      },
      {
        question: "How do I delete my data or get help?",
        answer:
          "Delete your account from Account settings or contact support through the channel on your purchase receipt. We aim to remove requested data within a reasonable time, subject to legal and operational requirements.",
      },
    ],
  },
  tr: {
    title: "Sıkça Sorulan Sorular",
    intro:
      "isendai hakkında hızlı yanıtlar: kontörler, yapay zekâ modelleri, gizlilik, ödemeler ve üretimlerden en iyi şekilde yararlanma.",
    metaDescription:
      "isendai SSS: kontör, AI katmanları, faturalama, gizlilik, araçlar, paylaşım ve destek.",
    items: [
      {
        question: "isendai nedir?",
        answer:
          "isendai, günlük iletişim için bir AI yazım paketidir. Göndermeden önce e-posta, iş, sosyal medya, flört profili ve daha fazlası için metin taslağı, yeniden yazma ve cilalama sunar.",
      },
      {
        question: "Abonelik gerekli mi?",
        answer:
          "Abonelik zorunlu değildir. Tek seferlik kontör paketi alabilir veya isteğe bağlı aylık/yıllık plan seçebilirsiniz. Her üretim için giriş yapmanız ve bakiyenizde yeterli kontör olması gerekir; kullanım, AI katmanı ve giriş uzunluğuna göre düşülür. Yeni üyeler, üyelik profilini tamamlayıp e-postayı doğruladıktan sonra tek seferlik 100 hoş geldin kontörü alır (hesap başına bir kez). Ortamınızda ödeme açıksa satın almalar Lemon Squeezy üzerinden yapılır (Paketler sayfasına bakın).",
      },
      {
        question: "Kontörler nasıl çalışır?",
        answer:
          "Kontörler, AI üretimi çalıştırmak için bakiyenizdir. Üretim yaptığınızda kontör otomatik düşülür. Lemon Squeezy ile paket satın alabilir veya üretim dışı ortamlarda Paketler sayfasındaki dev top-up seçeneklerini kullanabilirsiniz.",
      },
      {
        question: "Fast AI, Pro AI ve Genius AI nedir?",
        answer:
          "Bunlar teknik model adları değil, kullanıcıya yönelik kalite katmanlarıdır. Fast AI hızlı ve düşük maliyetli taslaklar için verimli modeller kullanır. Pro AI çoğu iş için kalite-hız dengesi sunar. Genius AI karmaşık veya kritik metinler için en güçlü modelleri kullanır.",
      },
      {
        question: "Üretim başına kontör nasıl hesaplanır?",
        answer:
          "Faturalama, giriş metninizin 100 karakterlik dilimleri üzerinden yapılır. Economy (Fast) katmanı dilim başına 0,2 kontör, Standard (Pro) 3 kontör, Premium (Genius) 5 kontör harcar. Kesirli tutarlar desteklenir (ör. 0,2 kontör).",
      },
      {
        question: "Metnim saklanıyor mu?",
        answer:
          "Girdiniz sonuç üretmek için işlenir. Geçmiş, sürümler ve cihazlar arası kontör için girdi ve çıktıları da saklayabiliriz. Gerekmedikçe hassas kişisel veri göndermeyin. Silme seçenekleri için Gizlilik Politikasına bakın.",
      },
      {
        question: "isendai hangi AI sağlayıcılarını kullanır?",
        answer:
          "İstekler, seçtiğiniz araç ve katmana göre OpenAI, Anthropic, Groq, DeepSeek ve Google gibi sağlayıcılara yönlendirilebilir. Sağlayıcılar metninizi yalnızca üretim isteğini yerine getirmek için işler.",
      },
      {
        question: "Nasıl giriş yaparım?",
        answer:
          "Sitede Giriş ile e-posta veya desteklenen OAuth (ör. Google) kullanın. Girişten sonra kontör bakiyeniz ve üretim geçmişiniz hesabınızla eşlenir.",
      },
      {
        question: "Ücretsiz deneme var mı?",
        answer:
          "Uygun kullanıcılar, kontör satın almadan önce bir cihazda ilk ücretsiz üretimi açabilir. Kampanya kuralları değişebilir; güncel teklifler için ana sayfa veya Paketler sayfasına bakın.",
      },
      {
        question: "Hangi araçlar var?",
        answer:
          "E-posta, LinkedIn gönderisi, ön yazı, yanıtlar, ton ayarı, flört biyosu ve daha fazlası için onlarca özel araç bulunur. Ana sayfadaki kategorilere göz atın veya kenar çubuğundan doğrudan açın.",
      },
      {
        question: "Alternatif sürümler üretebilir miyim?",
        answer:
          "Evet. Sonuç hazır olduktan sonra isteğe bağlı ek talimatlarla alternatif sürümler (üretim başına bir limite kadar) isteyebilir ve sonuç ekranında kayıtlı sürümler arasında geçiş yapabilirsiniz.",
      },
      {
        question: "Ödemeler nasıl işler?",
        answer:
          "Ödemeler Lemon Squeezy tarafından Merchant of Record olarak işlenir. Tam kart bilgilerinizi saklamayız. İade kuralları Lemon Squeezy ve yürürlükteki mevzuata tabidir; ayrıntılar için Kullanım Şartlarına bakın.",
      },
      {
        question: "Sonuçları sosyal medyada paylaşabilir miyim?",
        answer:
          "Evet. Sonuç ekranında metni kopyalayabilir, X, LinkedIn, Facebook, Instagram veya TikTok’ta paylaşabilir (panoya kopyala + platformu aç) veya Instagram/TikTok için paylaşım görseli indirebilirsiniz.",
      },
      {
        question: "Kontör biterse veya üretim başarısız olursa ne yapmalıyım?",
        answer:
          "Bakiye yetersizse Paketler sayfasına veya giriş yapmaya yönlendirilirsiniz. Hatalarda kısa süre bekleyip tekrar deneyin. Sürekli sorunlar hız limiti veya sağlayıcı kesintisi olabilir — gerekirse dekontunuzdaki destek kanalına yazın.",
      },
      {
        question: "Verilerimi nasıl silerim veya destek alırım?",
        answer:
          "Hesap ayarlarından hesabınızı silebilir veya satın alma dekontunuzdaki destek kanalıyla iletişime geçebilirsiniz. Talep edilen verileri yasal ve operasyonel gerekliliklere tabi olarak makul sürede silmeyi hedefleriz.",
      },
    ],
  },
  es: {
    title: "Preguntas frecuentes",
    intro:
      "Respuestas rápidas sobre isendai: créditos, modelos de IA, privacidad, pagos y cómo aprovechar al máximo tus generaciones.",
    metaDescription:
      "FAQ de isendai: créditos, niveles de IA, facturación, privacidad, herramientas, compartir y soporte.",
    items: [
      {
        question: "¿Qué es isendai?",
        answer:
          "isendai es una suite de escritura con IA para la comunicación diaria. Te ayuda a redactar, reescribir y pulir mensajes de email, trabajo, redes, perfiles de citas y más — antes de enviar.",
      },
      {
        question: "¿Necesito una suscripción?",
        answer:
          "No es obligatoria una suscripción. Puedes comprar paquetes de créditos puntuales u optar por un plan mensual o anual. Debes iniciar sesión y tener créditos suficientes en tu saldo; cada generación descuenta según el nivel de IA y la longitud del texto. Las cuentas nuevas empiezan con cero créditos — no es uso gratuito ilimitado. Las compras pasan por Lemon Squeezy cuando el checkout está activo en tu entorno (ver Precios).",
      },
      {
        question: "¿Cómo funcionan los créditos?",
        answer:
          "Los créditos son tu saldo para ejecutar generaciones de IA. Al generar, se descuentan automáticamente. Puedes recargar con paquetes de pago (Lemon Squeezy) o, en entornos no productivos, con las opciones dev descritas en Precios.",
      },
      {
        question: "¿Qué son Fast AI, Pro AI y Genius AI?",
        answer:
          "Son niveles de calidad orientados al usuario, no nombres técnicos de modelos. Fast AI usa modelos eficientes para borradores rápidos y económicos. Pro AI equilibra calidad y velocidad. Genius AI usa los modelos más potentes para textos complejos o críticos.",
      },
      {
        question: "¿Cómo se cobran los créditos por generación?",
        answer:
          "La facturación usa bloques de 100 caracteres de tu texto de entrada. Economy (Fast) cuesta 0,2 créditos por bloque, Standard (Pro) 3 créditos y Premium (Genius) 5 créditos. Se admiten cantidades fraccionarias.",
      },
      {
        question: "¿Se almacena mi texto?",
        answer:
          "Tu entrada se procesa para generar resultados. También podemos almacenar entradas y salidas para historial, versiones y créditos entre dispositivos. Evita datos personales sensibles salvo necesidad. Consulta la Política de privacidad.",
      },
      {
        question: "¿Qué proveedores de IA usa isendai?",
        answer:
          "Las solicitudes pueden enrutarse a OpenAI, Anthropic, Groq, DeepSeek, Google u otros según la herramienta y el nivel. Los proveedores procesan tu texto solo para cumplir la generación.",
      },
      {
        question: "¿Cómo inicio sesión?",
        answer:
          "Usa Iniciar sesión con tu email o proveedores OAuth compatibles (p. ej. Google). Tras iniciar sesión, tu saldo e historial se sincronizan con tu cuenta.",
      },
      {
        question: "¿Hay prueba gratuita?",
        answer:
          "Usuarios elegibles pueden desbloquear una primera generación gratuita en un dispositivo antes de comprar créditos. Las reglas pueden cambiar; revisa la página de inicio o Precios.",
      },
      {
        question: "¿Qué herramientas hay?",
        answer:
          "Incluye muchas herramientas especializadas: emails, LinkedIn, cartas, respuestas, tono, bios de citas y más. Explora categorías en inicio o abre una herramienta desde la barra lateral.",
      },
      {
        question: "¿Puedo generar versiones alternativas?",
        answer:
          "Sí. Tras un resultado puedes pedir versiones alternativas (hasta un límite por generación) con instrucciones extra y cambiar entre versiones guardadas en la pantalla de resultados.",
      },
      {
        question: "¿Cómo funcionan los pagos?",
        answer:
          "Lemon Squeezy procesa los pagos como comerciante de registro. No almacenamos los datos completos de tu tarjeta. Los reembolsos siguen sus políticas y la ley aplicable; ver Términos del servicio.",
      },
      {
        question: "¿Puedo compartir en redes sociales?",
        answer:
          "Sí. En resultados puedes copiar, compartir en X, LinkedIn, Facebook, Instagram o TikTok, o descargar una imagen para Instagram y TikTok.",
      },
      {
        question: "¿Qué hago si me quedo sin créditos o falla la generación?",
        answer:
          "Si el saldo es bajo, se te indicará ir a Precios o iniciar sesión. En errores, espera y reintenta. Problemas persistentes pueden ser límites de tasa o caídas del proveedor — contacta soporte con tu recibo.",
      },
      {
        question: "¿Cómo borro mis datos o pido ayuda?",
        answer:
          "Elimina tu cuenta en Ajustes de cuenta o contacta soporte por el canal del recibo de compra. Procuramos eliminar datos solicitados en un plazo razonable según requisitos legales y operativos.",
      },
    ],
  },
  fr: {
    title: "Foire aux questions",
    intro:
      "Réponses rapides sur isendai : crédits, modèles IA, confidentialité, paiements et bonnes pratiques pour vos générations.",
    metaDescription:
      "FAQ isendai : crédits, niveaux IA, facturation, confidentialité, outils, partage et assistance.",
    items: [
      {
        question: "Qu’est-ce qu’isendai ?",
        answer:
          "isendai est une suite d’écriture IA pour la communication quotidienne. Elle aide à rédiger, reformuler et peaufiner emails, messages pro, réseaux sociaux, profils de rencontre, etc. — avant d’envoyer.",
      },
      {
        question: "Faut-il un abonnement ?",
        answer:
          "Aucun abonnement n’est obligatoire. Vous pouvez acheter des packs de crédits ponctuels ou choisir un forfait mensuel ou annuel optionnel. Vous devez être connecté et disposer de crédits suffisants ; chaque génération est débitée selon le niveau IA et la longueur du texte. Les nouveaux membres reçoivent 100 crédits de bienvenue une fois après avoir complété le profil membre et vérifié l’e-mail (une fois par compte). Les achats passent par Lemon Squeezy lorsque le paiement est activé dans votre environnement (voir Tarifs).",
      },
      {
        question: "Comment fonctionnent les crédits ?",
        answer:
          "Les crédits sont votre solde pour lancer des générations IA. Ils sont déduits automatiquement. Rechargez via des packs payants (Lemon Squeezy) ou, hors production, via les options dev décrites sur Tarifs.",
      },
      {
        question: "Que sont Fast AI, Pro AI et Genius AI ?",
        answer:
          "Ce sont des niveaux de qualité pour l’utilisateur, pas des noms techniques. Fast AI privilégie des modèles efficaces pour des brouillons rapides et économiques. Pro AI équilibre qualité et vitesse. Genius AI utilise nos modèles les plus puissants pour l’écriture exigeante.",
      },
      {
        question: "Comment les crédits sont-ils facturés ?",
        answer:
          "La facturation utilise des blocs de 100 caractères de votre texte. Economy (Fast) : 0,2 crédit par bloc ; Standard (Pro) : 3 ; Premium (Genius) : 5. Les montants fractionnaires sont pris en charge.",
      },
      {
        question: "Mon texte est-il stocké ?",
        answer:
          "Votre saisie est traitée pour produire des résultats. Nous pouvons aussi stocker entrées et sorties pour l’historique, les versions et les crédits multi-appareils. Évitez les données sensibles sauf nécessité. Voir la Politique de confidentialité.",
      },
      {
        question: "Quels fournisseurs IA utilise isendai ?",
        answer:
          "Les requêtes peuvent être routées vers OpenAI, Anthropic, Groq, DeepSeek, Google, etc. selon l’outil et le niveau. Les fournisseurs traitent votre texte uniquement pour la génération.",
      },
      {
        question: "Comment se connecter ?",
        answer:
          "Utilisez Connexion avec votre e-mail ou OAuth pris en charge (ex. Google). Après connexion, votre solde et votre historique sont liés à votre compte.",
      },
      {
        question: "Y a-t-il un essai gratuit ?",
        answer:
          "Les utilisateurs éligibles peuvent débloquer une première génération gratuite sur un appareil avant d’acheter des crédits. Les règles peuvent évoluer ; consultez l’accueil ou Tarifs.",
      },
      {
        question: "Quels outils sont disponibles ?",
        answer:
          "De nombreux outils spécialisés : emails, LinkedIn, lettres de motivation, réponses, ton, bios de rencontre, etc. Parcourez les catégories sur l’accueil ou ouvrez un outil depuis la barre latérale.",
      },
      {
        question: "Puis-je générer des versions alternatives ?",
        answer:
          "Oui. Après un résultat, vous pouvez demander des versions alternatives (dans une limite par génération) avec des instructions supplémentaires et basculer entre les versions enregistrées.",
      },
      {
        question: "Comment fonctionnent les paiements ?",
        answer:
          "Lemon Squeezy traite les paiements en tant que revendeur officiel. Nous ne stockons pas les données complètes de carte. Remboursements selon leurs règles et la loi ; voir les Conditions d’utilisation.",
      },
      {
        question: "Puis-je partager sur les réseaux sociaux ?",
        answer:
          "Oui. Sur l’écran de résultats : copier, partager sur X, LinkedIn, Facebook, Instagram ou TikTok, ou télécharger une image pour Instagram et TikTok.",
      },
      {
        question: "Que faire en cas de crédits épuisés ou d’échec ?",
        answer:
          "Solde insuffisant : vous serez invité à aller sur Tarifs ou vous connecter. En cas d’erreur, attendez et réessayez. Problèmes persistants : limites de débit ou panne fournisseur — contactez le support via votre reçu.",
      },
      {
        question: "Comment supprimer mes données ou obtenir de l’aide ?",
        answer:
          "Supprimez votre compte dans les paramètres Compte ou contactez le support via le canal indiqué sur votre reçu. Nous visons une suppression dans un délai raisonnable, sous réserve des obligations légales.",
      },
    ],
  },
  de: {
    title: "Häufig gestellte Fragen",
    intro:
      "Kurze Antworten zu isendai — Credits, KI-Modelle, Datenschutz, Zahlungen und Tipps für deine Generierungen.",
    metaDescription:
      "FAQ zu isendai: Credits, KI-Stufen, Abrechnung, Datenschutz, Tools, Teilen und Support.",
    items: [
      {
        question: "Was ist isendai?",
        answer:
          "isendai ist eine KI-Schreibsuite für die tägliche Kommunikation. Sie hilft beim Entwerfen, Umschreiben und Verfeinern von E-Mails, Arbeitstexten, Social Media, Dating-Profilen und mehr — bevor du sendest.",
      },
      {
        question: "Brauche ich ein Abo?",
        answer:
          "Ein Abo ist nicht Pflicht. Du kannst einmalige Credit-Pakete kaufen oder optional einen Monats- oder Jahresplan wählen. Für jede Generierung musst du angemeldet sein und genug Credits auf dem Konto haben; abgerechnet wird nach KI-Stufe und Textlänge. Neue Mitglieder erhalten einmalig 100 Willkommens-Credits, nachdem Profil und E-Mail bestätigt sind (einmal pro Konto). Käufe laufen über Lemon Squeezy, wenn Checkout in deiner Umgebung aktiv ist (siehe Preise).",
      },
      {
        question: "Wie funktionieren Credits?",
        answer:
          "Credits sind dein Guthaben für KI-Generierungen. Sie werden automatisch abgezogen. Aufladen über bezahlte Pakete (Lemon Squeezy) oder in Nicht-Produktion über Dev-Top-up auf der Preisseite.",
      },
      {
        question: "Was sind Fast AI, Pro AI und Genius AI?",
        answer:
          "Das sind nutzerorientierte Qualitätsstufen, keine technischen Modellnamen. Fast AI nutzt effiziente Modelle für schnelle, günstige Entwürfe. Pro AI balanciert Qualität und Tempo. Genius AI nutzt die stärksten Modelle für anspruchsvolle Texte.",
      },
      {
        question: "Wie werden Credits pro Generierung berechnet?",
        answer:
          "Abrechnung in 100-Zeichen-Blöcken deines Eingabetextes. Economy (Fast): 0,2 Credits pro Block, Standard (Pro): 3, Premium (Genius): 5. Bruchteile sind möglich.",
      },
      {
        question: "Wird mein Text gespeichert?",
        answer:
          "Deine Eingabe wird verarbeitet. Wir können Eingaben und Ausgaben auch speichern für Verlauf, Versionen und geräteübergreifende Credits. Keine sensiblen Daten ohne Not. Siehe Datenschutz.",
      },
      {
        question: "Welche KI-Anbieter nutzt isendai?",
        answer:
          "Anfragen können je nach Tool und Stufe an OpenAI, Anthropic, Groq, DeepSeek, Google u. a. geroutet werden. Anbieter verarbeiten Text nur für die Generierung.",
      },
      {
        question: "Wie melde ich mich an?",
        answer:
          "Nutze Anmelden mit E-Mail oder unterstütztem OAuth (z. B. Google). Danach synchronisieren sich Guthaben und Verlauf mit deinem Konto.",
      },
      {
        question: "Gibt es eine kostenlose Testversion?",
        answer:
          "Berechtigte Nutzer können auf einem Gerät eine erste kostenlose Generierung freischalten. Regeln können sich ändern — Startseite oder Preise prüfen.",
      },
      {
        question: "Welche Tools gibt es?",
        answer:
          "Viele Spezial-Tools: E-Mails, LinkedIn, Anschreiben, Antworten, Ton, Dating-Bios u. v. m. Kategorien auf der Startseite oder direkt in der Seitenleiste öffnen.",
      },
      {
        question: "Kann ich alternative Versionen erzeugen?",
        answer:
          "Ja. Nach einem Ergebnis kannst du Alternativen (bis zu einem Limit pro Generierung) mit Zusatzanweisungen anfordern und zwischen gespeicherten Versionen wechseln.",
      },
      {
        question: "Wie funktionieren Zahlungen?",
        answer:
          "Zahlungen über Lemon Squeezy als Merchant of Record. Keine vollständigen Kartendaten bei uns. Erstattungen nach deren Regeln und Gesetz — siehe Nutzungsbedingungen.",
      },
      {
        question: "Kann ich in sozialen Medien teilen?",
        answer:
          "Ja. Auf dem Ergebnisbildschirm: kopieren, teilen auf X, LinkedIn, Facebook, Instagram oder TikTok, oder Share-Bild für Instagram/TikTok herunterladen.",
      },
      {
        question: "Was tun bei leerem Guthaben oder Fehlern?",
        answer:
          "Bei zu wenig Guthaben: Hinweis zu Preise oder Anmeldung. Bei Fehlern kurz warten und erneut versuchen. Anhaltende Probleme: Rate-Limits oder Ausfall — Support über Kaufbeleg.",
      },
      {
        question: "Wie lösche ich Daten oder bekomme Hilfe?",
        answer:
          "Konto in den Kontoeinstellungen löschen oder Support über den Kanal auf dem Kaufbeleg. Löschung angemessen schnell, vorbehaltlich rechtlicher Anforderungen.",
      },
    ],
  },
  zh: {
    title: "常见问题",
    intro:
      "关于 isendai 的快速解答 — 积分、AI 模型、隐私、付款以及如何充分利用每次生成。",
    metaDescription: "isendai 常见问题：积分、AI 层级、计费、隐私、工具、分享与支持。",
    items: [
      {
        question: "什么是 isendai？",
        answer:
          "isendai 是面向日常沟通的 AI 写作套件，帮助您在发送前起草、改写和润色邮件、工作消息、社交媒体、交友简介等文本。",
      },
      {
        question: "需要订阅吗？",
        answer:
          "不强制订阅。可购买一次性积分包，或选择可选的月付/年付计划。每次生成须登录且余额充足；按 AI 层级与输入长度扣费。新会员在完成会员资料并验证邮箱后，可一次性获得 100 欢迎额度（每账户一次）。在您的环境中启用结账时，购买通过 Lemon Squeezy 完成（见定价页）。",
      },
      {
        question: "积分如何运作？",
        answer:
          "积分是运行 AI 生成的余额，生成时自动扣除。可通过付费包（Lemon Squeezy）充值；在非生产环境中可使用定价页说明的开发者充值选项。",
      },
      {
        question: "Fast AI、Pro AI 和 Genius AI 是什么？",
        answer:
          "它们是面向用户的质量层级，而非技术模型名称。Fast AI 使用高效模型，快速且成本低；Pro AI 在质量与速度间平衡；Genius AI 使用最强模型处理复杂或重要写作。",
      },
      {
        question: "每次生成如何计费？",
        answer:
          "按输入文本每 100 个字符为一个计费块。Economy（Fast）每块 0.2 积分，Standard（Pro）3 积分，Premium（Genius）5 积分，支持小数（如 0.2 积分）。",
      },
      {
        question: "我的文本会被存储吗？",
        answer:
          "您的输入会被处理以生成结果。我们也可能存储输入与输出，以便跨设备访问历史、版本和积分。除非必要，请勿提交敏感个人数据。详见隐私政策。",
      },
      {
        question: "isendai 使用哪些 AI 提供商？",
        answer:
          "根据工具和所选层级，请求可能路由至 OpenAI、Anthropic、Groq、DeepSeek、Google 等。提供商仅为完成生成请求而处理您的文本。",
      },
      {
        question: "如何登录？",
        answer: "通过网站登录，使用邮箱或支持的 OAuth（如 Google）。登录后，积分余额与生成历史将同步到您的账户。",
      },
      {
        question: "有免费试用吗？",
        answer:
          "符合条件的用户可在购买积分前在一台设备上解锁首次免费生成。规则可能变更，请查看首页或定价页的最新说明。",
      },
      {
        question: "有哪些工具？",
        answer:
          "包含多种专用工具：邮件、LinkedIn 帖子、求职信、回复、语气调整、交友简介等。可在首页浏览分类或从侧边栏直接打开。",
      },
      {
        question: "可以生成多个版本吗？",
        answer:
          "可以。结果就绪后，可请求替代版本（每次生成有上限），并可附加说明，在结果页切换已保存的版本。",
      },
      {
        question: "付款如何运作？",
        answer:
          "付款由 Lemon Squeezy 作为官方商户处理。我们不存储完整银行卡信息。退款遵循其政策与适用法律，详见服务条款。",
      },
      {
        question: "可以在社交媒体分享吗？",
        answer:
          "可以。在结果页可复制文本，分享至 X、LinkedIn、Facebook、Instagram 或 TikTok，或下载适用于 Instagram/TikTok 的分享图片。",
      },
      {
        question: "积分用完或生成失败怎么办？",
        answer:
          "余额不足时会提示前往定价页或登录。出错时请稍候重试。持续问题可能是速率限制或提供商故障 — 可通过购买收据上的支持渠道联系。",
      },
      {
        question: "如何删除数据或获取帮助？",
        answer:
          "可在账户设置中删除账户，或通过购买收据上的支持渠道联系我们。我们将在合理期限内删除所请求的数据，但须遵守法律与运营要求。",
      },
    ],
  },
};

export function getFaqContent(locale: Locale): FaqPageContent {
  const base = FAQ_CONTENT[locale] ?? FAQ_CONTENT.en;
  const support = faqSupportAnswers(locale);
  const items = base.items.map((item, i) => {
    const n = base.items.length;
    if (i === n - 2) return { ...item, answer: support.help };
    if (i === n - 1) return { ...item, answer: support.delete };
    return item;
  });
  return { ...base, items };
}
