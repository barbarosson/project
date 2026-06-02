import type { Locale } from "@/i18n/dictionaries";
import type { InstallPlatform } from "@/lib/pwa/install-guide-path";

export type InstallStep = { title: string; body: string };

export type InstallPlatformGuide = {
  label: string;
  intro: string;
  steps: InstallStep[];
  tip: string;
};

export type InstallGuideContent = {
  title: string;
  intro: string;
  metaDescription: string;
  selectPlatform: string;
  stepLabel: string;
  alreadyInstalledTitle: string;
  alreadyInstalledBody: string;
  tryInstallCta: string;
  platforms: Record<InstallPlatform, InstallPlatformGuide>;
};

export const INSTALL_GUIDE_CONTENT: Record<Locale, InstallGuideContent> = {
  en: {
    title: "Install isendai on your device",
    intro:
      "Add isendai to your home screen or desktop for quick access — like a native app, without an app store download.",
    metaDescription:
      "Step-by-step guide to install the isendai PWA on iPhone, iPad, Android, and desktop browsers.",
    selectPlatform: "Choose your device",
    stepLabel: "Step",
    alreadyInstalledTitle: "Already installed?",
    alreadyInstalledBody: "Open isendai from your home screen or app list — it runs full-screen without the browser bar.",
    tryInstallCta: "Try install from this page",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "Works in Safari, Chrome, and other browsers on iOS. All use the same Share menu flow.",
        steps: [
          {
            title: "Open isendai in your browser",
            body: "Go to isendai.com and sign in if you want your credits synced. Stay on the site — do not use a private tab if you need to stay signed in.",
          },
          {
            title: "Tap the Share button",
            body: "In Safari: tap the Share icon at the bottom (square with an arrow pointing up). In Chrome: tap Share in the address bar or the ⋮ menu, then Share.",
          },
          {
            title: "Choose “Add to Home Screen”",
            body: "Scroll the share sheet and tap Add to Home Screen. You may need to tap “More” first to find it.",
          },
          {
            title: "Confirm the name and tap Add",
            body: "Keep the name “isendai” or edit it, then tap Add. The icon appears on your home screen — open it like any other app.",
          },
        ],
        tip: "Tip: If Share is hard to find, use Safari — Apple’s browser shows Add to Home Screen most reliably.",
      },
      android: {
        label: "Android",
        intro: "Chrome is recommended. Samsung Internet and Edge follow a similar menu flow.",
        steps: [
          {
            title: "Open isendai in Chrome",
            body: "Visit isendai.com. Sign in so your account and credits are ready after install.",
          },
          {
            title: "Open the browser menu",
            body: "Tap the three-dot menu (⋮) in the top-right corner of Chrome.",
          },
          {
            title: "Tap “Install app” or “Add to Home screen”",
            body: "The exact label varies by Chrome version. Some phones show a banner at the bottom — tap Install there if you see it.",
          },
          {
            title: "Confirm and open from the app drawer",
            body: "Tap Install or Add. isendai appears on your home screen and in the app list. Launch it for a full-screen experience.",
          },
        ],
        tip: "Tip: No install option? Update Chrome, visit the site again, and wait a few seconds — the menu item appears after the page loads fully.",
      },
      desktop: {
        label: "Desktop (Chrome / Edge)",
        intro: "Install as a standalone window on Windows, macOS, or Linux.",
        steps: [
          {
            title: "Open isendai in Chrome or Edge",
            body: "Go to isendai.com and sign in. Installation works best in Chromium-based browsers.",
          },
          {
            title: "Look for the install control",
            body: "Chrome/Edge often show a install icon (⊕ or computer) in the address bar. Or open the menu (⋮) → Install isendai / Apps → Install this site as an app.",
          },
          {
            title: "Confirm in the dialog",
            body: "Click Install. The app opens in its own window without tabs or the full browser chrome.",
          },
          {
            title: "Pin for quick access",
            body: "On Windows: pin to taskbar. On macOS: keep in the Dock. You can also find isendai in your applications folder.",
          },
        ],
        tip: "Tip: Firefox and Safari on desktop have limited PWA install support — use Chrome or Edge for the best experience.",
      },
    },
  },
  tr: {
    title: "isendai'yi cihazınıza yükleyin",
    intro:
      "isendai'yi ana ekrana veya masaüstüne ekleyin — mağaza indirmesi olmadan uygulama gibi hızlı erişim.",
    metaDescription:
      "isendai PWA kurulum rehberi: iPhone, iPad, Android ve masaüstü tarayıcılar için adım adım talimatlar.",
    selectPlatform: "Cihazınızı seçin",
    stepLabel: "Adım",
    alreadyInstalledTitle: "Zaten yüklü mü?",
    alreadyInstalledBody:
      "isendai'yi ana ekrandan veya uygulama listesinden açın — tarayıcı çubuğu olmadan tam ekran çalışır.",
    tryInstallCta: "Bu sayfadan yüklemeyi dene",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "iOS'ta Safari, Chrome ve diğer tarayıcılarda çalışır. Hepsi Paylaş menüsünü kullanır.",
        steps: [
          {
            title: "isendai'yi tarayıcıda açın",
            body: "isendai.com adresine gidin. Kontörleriniz senkron kalsın istiyorsanız giriş yapın. Gizli sekme kullanmayın.",
          },
          {
            title: "Paylaş düğmesine dokunun",
            body: "Safari'de alttaki Paylaş simgesine (yukarı oklu kare) dokunun. Chrome'da adres çubuğundaki Paylaş veya ⋮ menüsünden Paylaş'ı seçin.",
          },
          {
            title: "«Ana Ekrana Ekle»yi seçin",
            body: "Paylaşım sayfasında aşağı kaydırın ve Ana Ekrana Ekle'ye dokunun. Görünmüyorsa önce «Daha Fazla»ya bakın.",
          },
          {
            title: "Onaylayın ve Ekle'ye dokunun",
            body: "İsim «isendai» olarak kalabilir; Ekle'ye dokunun. Simge ana ekranınızda görünür — normal bir uygulama gibi açın.",
          },
        ],
        tip: "İpucu: Paylaş'ı bulmak zorsa Safari kullanın — Ana Ekrana Ekle en tutarlı Safari'de görünür.",
      },
      android: {
        label: "Android",
        intro: "Chrome önerilir. Samsung Internet ve Edge benzer menü akışına sahiptir.",
        steps: [
          {
            title: "isendai'yi Chrome'da açın",
            body: "isendai.com adresine gidin. Kurulumdan sonra hesabınız hazır olsun diye giriş yapın.",
          },
          {
            title: "Tarayıcı menüsünü açın",
            body: "Chrome'un sağ üst köşesindeki üç nokta (⋮) menüsüne dokunun.",
          },
          {
            title: "«Uygulamayı yükle» veya «Ana ekrana ekle»",
            body: "Chrome sürümüne göre metin değişir. Altta banner görürseniz Yükle'ye dokunun.",
          },
          {
            title: "Onaylayın ve uygulama çekmecesinden açın",
            body: "Yükle veya Ekle'ye dokunun. isendai ana ekranda ve uygulama listesinde görünür.",
          },
        ],
        tip: "İpucu: Seçenek yoksa Chrome'u güncelleyin, siteyi yeniden açın ve birkaç saniye bekleyin.",
      },
      desktop: {
        label: "Masaüstü (Chrome / Edge)",
        intro: "Windows, macOS veya Linux'ta ayrı pencere olarak yükleyin.",
        steps: [
          {
            title: "isendai'yi Chrome veya Edge'de açın",
            body: "isendai.com adresine gidin ve giriş yapın. Chromium tabanlı tarayıcılar en iyi sonucu verir.",
          },
          {
            title: "Yükleme düğmesini bulun",
            body: "Adres çubuğunda yükle simgesi (⊕) olabilir. Veya menü (⋮) → isendai'yi yükle / Uygulamalar → Bu siteyi uygulama olarak yükle.",
          },
          {
            title: "Pencerede onaylayın",
            body: "Yükle'ye tıklayın. Uygulama sekmesiz, ayrı bir pencerede açılır.",
          },
          {
            title: "Hızlı erişim için sabitleyin",
            body: "Windows'ta görev çubuğuna, macOS'ta Dock'a sabitleyebilirsiniz.",
          },
        ],
        tip: "İpucu: Masaüstü Firefox ve Safari'de PWA desteği sınırlıdır — Chrome veya Edge kullanın.",
      },
    },
  },
  es: {
    title: "Instalar isendai en tu dispositivo",
    intro:
      "Añade isendai a la pantalla de inicio o al escritorio para acceder rápido, como una app nativa sin tienda.",
    metaDescription:
      "Guía paso a paso para instalar la PWA isendai en iPhone, iPad, Android y navegadores de escritorio.",
    selectPlatform: "Elige tu dispositivo",
    stepLabel: "Paso",
    alreadyInstalledTitle: "¿Ya instalada?",
    alreadyInstalledBody:
      "Abre isendai desde la pantalla de inicio o la lista de apps — funciona a pantalla completa.",
    tryInstallCta: "Probar instalación desde esta página",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "Funciona en Safari, Chrome y otros navegadores de iOS con el menú Compartir.",
        steps: [
          { title: "Abre isendai en el navegador", body: "Entra en isendai.com e inicia sesión si quieres sincronizar créditos." },
          { title: "Toca Compartir", body: "En Safari: icono Compartir abajo. En Chrome: Compartir en la barra o menú ⋮." },
          { title: "Elige «Añadir a la pantalla de inicio»", body: "Desplázate en la hoja de compartir y tócala. Puede estar en «Más»." },
          { title: "Confirma y pulsa Añadir", body: "Mantén el nombre isendai y pulsa Añadir. El icono aparecerá en tu inicio." },
        ],
        tip: "Consejo: Safari suele mostrar «Añadir a la pantalla de inicio» con más fiabilidad.",
      },
      android: {
        label: "Android",
        intro: "Se recomienda Chrome. Samsung Internet y Edge siguen un flujo similar.",
        steps: [
          { title: "Abre isendai en Chrome", body: "Visita isendai.com e inicia sesión." },
          { title: "Abre el menú del navegador", body: "Toca el menú de tres puntos (⋮) arriba a la derecha." },
          { title: "Toca «Instalar app» o «Añadir a inicio»", body: "El texto varía. Si hay un banner abajo, pulsa Instalar." },
          { title: "Confirma y abre desde el cajón de apps", body: "Pulsa Instalar o Añadir. isendai aparece en inicio y lista de apps." },
        ],
        tip: "Consejo: ¿No aparece? Actualiza Chrome, recarga y espera unos segundos.",
      },
      desktop: {
        label: "Escritorio (Chrome / Edge)",
        intro: "Instala como ventana independiente en Windows, macOS o Linux.",
        steps: [
          { title: "Abre isendai en Chrome o Edge", body: "Ve a isendai.com e inicia sesión." },
          { title: "Busca el control de instalación", body: "Icono en la barra de direcciones o menú ⋮ → Instalar isendai." },
          { title: "Confirma en el diálogo", body: "Pulsa Instalar. Se abre en ventana propia sin pestañas." },
          { title: "Fija para acceso rápido", body: "Ancla a la barra de tareas o al Dock." },
        ],
        tip: "Consejo: Firefox y Safari en escritorio tienen soporte PWA limitado.",
      },
    },
  },
  fr: {
    title: "Installer isendai sur votre appareil",
    intro:
      "Ajoutez isendai à l’écran d’accueil ou au bureau pour un accès rapide, comme une app sans store.",
    metaDescription:
      "Guide pas à pas pour installer la PWA isendai sur iPhone, iPad, Android et navigateurs desktop.",
    selectPlatform: "Choisissez votre appareil",
    stepLabel: "Étape",
    alreadyInstalledTitle: "Déjà installé ?",
    alreadyInstalledBody:
      "Ouvrez isendai depuis l’écran d’accueil ou la liste d’apps — plein écran sans barre du navigateur.",
    tryInstallCta: "Essayer l’installation depuis cette page",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "Fonctionne dans Safari, Chrome et autres navigateurs iOS via Partager.",
        steps: [
          { title: "Ouvrez isendai dans le navigateur", body: "Allez sur isendai.com et connectez-vous si besoin." },
          { title: "Touchez Partager", body: "Safari : icône Partager en bas. Chrome : Partager dans la barre ou menu ⋮." },
          { title: "Choisissez « Sur l’écran d’accueil »", body: "Faites défiler la feuille de partage. Option parfois sous « Plus »." },
          { title: "Confirmez et touchez Ajouter", body: "Gardez le nom isendai et touchez Ajouter." },
        ],
        tip: "Astuce : Safari affiche le plus souvent « Sur l’écran d’accueil ».",
      },
      android: {
        label: "Android",
        intro: "Chrome recommandé. Samsung Internet et Edge suivent un flux similaire.",
        steps: [
          { title: "Ouvrez isendai dans Chrome", body: "Visitez isendai.com et connectez-vous." },
          { title: "Ouvrez le menu du navigateur", body: "Touchez le menu ⋮ en haut à droite." },
          { title: "Touchez « Installer l’app » ou « Ajouter »", body: "Libellé variable. Bannière en bas possible — touchez Installer." },
          { title: "Confirmez et ouvrez depuis le tiroir d’apps", body: "Touchez Installer ou Ajouter." },
        ],
        tip: "Astuce : Mettez Chrome à jour et rechargez la page si l’option n’apparaît pas.",
      },
      desktop: {
        label: "Bureau (Chrome / Edge)",
        intro: "Installez comme fenêtre autonome sur Windows, macOS ou Linux.",
        steps: [
          { title: "Ouvrez isendai dans Chrome ou Edge", body: "Allez sur isendai.com et connectez-vous." },
          { title: "Trouvez le bouton d’installation", body: "Icône dans la barre d’adresse ou menu ⋮ → Installer isendai." },
          { title: "Confirmez dans la boîte de dialogue", body: "Cliquez Installer. Fenêtre dédiée sans onglets." },
          { title: "Épinglez pour un accès rapide", body: "Barre des tâches ou Dock." },
        ],
        tip: "Astuce : Firefox et Safari desktop ont un support PWA limité.",
      },
    },
  },
  de: {
    title: "isendai auf dem Gerät installieren",
    intro:
      "isendai zum Home-Bildschirm oder Desktop hinzufügen — schneller Zugriff wie eine native App ohne Store.",
    metaDescription:
      "Schritt-für-Schritt-Anleitung: isendai PWA auf iPhone, iPad, Android und Desktop installieren.",
    selectPlatform: "Gerät wählen",
    stepLabel: "Schritt",
    alreadyInstalledTitle: "Bereits installiert?",
    alreadyInstalledBody:
      "isendai vom Home-Bildschirm oder aus der App-Liste öffnen — Vollbild ohne Browser-Leiste.",
    tryInstallCta: "Installation von dieser Seite versuchen",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "Funktioniert in Safari, Chrome und anderen iOS-Browsern über Teilen.",
        steps: [
          { title: "isendai im Browser öffnen", body: "isendai.com aufrufen und ggf. anmelden." },
          { title: "Teilen tippen", body: "Safari: Teilen unten. Chrome: Teilen in der Adressleiste oder im ⋮-Menü." },
          { title: "„Zum Home-Bildschirm“ wählen", body: "In der Teilen-Ansicht nach unten scrollen. Ggf. unter „Mehr“." },
          { title: "Bestätigen und Hinzufügen tippen", body: "Name isendai behalten und Hinzufügen tippen." },
        ],
        tip: "Tipp: Safari zeigt „Zum Home-Bildschirm“ am zuverlässigsten.",
      },
      android: {
        label: "Android",
        intro: "Chrome empfohlen. Samsung Internet und Edge ähnlich.",
        steps: [
          { title: "isendai in Chrome öffnen", body: "isendai.com besuchen und anmelden." },
          { title: "Browser-Menü öffnen", body: "Drei-Punkte-Menü (⋮) oben rechts." },
          { title: "„App installieren“ oder „Zum Startbildschirm“", body: "Bezeichnung variiert. Banner unten möglich." },
          { title: "Bestätigen und aus App-Drawer öffnen", body: "Installieren oder Hinzufügen tippen." },
        ],
        tip: "Tipp: Chrome aktualisieren und Seite neu laden, wenn die Option fehlt.",
      },
      desktop: {
        label: "Desktop (Chrome / Edge)",
        intro: "Als eigenes Fenster unter Windows, macOS oder Linux installieren.",
        steps: [
          { title: "isendai in Chrome oder Edge öffnen", body: "isendai.com aufrufen und anmelden." },
          { title: "Installations-Steuerung finden", body: "Symbol in der Adressleiste oder Menü ⋮ → isendai installieren." },
          { title: "Im Dialog bestätigen", body: "Installieren klicken. Eigenes Fenster ohne Tabs." },
          { title: "Für schnellen Zugriff anheften", body: "Taskleiste oder Dock." },
        ],
        tip: "Tipp: Firefox und Safari Desktop haben begrenzte PWA-Unterstützung.",
      },
    },
  },
  zh: {
    title: "在设备上安装 isendai",
    intro: "将 isendai 添加到主屏幕或桌面，像原生应用一样快速打开，无需应用商店下载。",
    metaDescription: "isendai PWA 安装指南：iPhone、iPad、Android 与桌面浏览器分步说明。",
    selectPlatform: "选择您的设备",
    stepLabel: "步骤",
    alreadyInstalledTitle: "已经安装？",
    alreadyInstalledBody: "从主屏幕或应用列表打开 isendai — 全屏运行，无浏览器地址栏。",
    tryInstallCta: "在此页面尝试安装",
    platforms: {
      ios: {
        label: "iPhone / iPad",
        intro: "适用于 iOS 上的 Safari、Chrome 等浏览器，均通过「分享」菜单安装。",
        steps: [
          { title: "在浏览器中打开 isendai", body: "访问 isendai.com，如需同步额度请登录。" },
          { title: "点击「分享」", body: "Safari：底部分享图标。Chrome：地址栏或 ⋮ 菜单中的分享。" },
          { title: "选择「添加到主屏幕」", body: "在分享面板中向下滑动。可能在「更多」中。" },
          { title: "确认并点击「添加」", body: "保留名称 isendai，点击添加。图标将出现在主屏幕。" },
        ],
        tip: "提示：Safari 最常稳定显示「添加到主屏幕」。",
      },
      android: {
        label: "Android",
        intro: "推荐使用 Chrome。Samsung Internet 与 Edge 流程类似。",
        steps: [
          { title: "在 Chrome 中打开 isendai", body: "访问 isendai.com 并登录。" },
          { title: "打开浏览器菜单", body: "点击右上角三点菜单 (⋮)。" },
          { title: "点击「安装应用」或「添加到主屏幕」", body: "文案因版本而异。底部横幅可直接点安装。" },
          { title: "确认并从应用抽屉打开", body: "点击安装或添加。isendai 出现在主屏幕与应用列表。" },
        ],
        tip: "提示：若无选项，请更新 Chrome 并重新加载页面。" },
      desktop: {
        label: "桌面（Chrome / Edge）",
        intro: "在 Windows、macOS 或 Linux 上安装为独立窗口。",
        steps: [
          { title: "在 Chrome 或 Edge 中打开 isendai", body: "访问 isendai.com 并登录。" },
          { title: "找到安装控件", body: "地址栏安装图标，或菜单 ⋮ → 安装 isendai。" },
          { title: "在对话框中确认", body: "点击安装。以独立窗口打开，无标签页。" },
          { title: "固定以便快速访问", body: "可固定到任务栏或 Dock。" },
        ],
        tip: "提示：桌面版 Firefox 与 Safari 的 PWA 支持有限。",
      },
    },
  },
};

export function getInstallGuideContent(locale: Locale): InstallGuideContent {
  return INSTALL_GUIDE_CONTENT[locale] ?? INSTALL_GUIDE_CONTENT.en;
}
