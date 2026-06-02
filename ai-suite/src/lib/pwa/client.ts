/** True when the app runs as an installed PWA (standalone / iOS home screen). */
export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") return false;
  const mq = window.matchMedia("(display-mode: standalone)");
  if (mq.matches) return true;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

/** iOS / iPadOS (all browsers use WebKit — install via Share → Add to Home Screen). */
export function isIosDevice(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

/** @deprecated Use {@link isIosDevice}. */
export function isIosInstallBrowser(): boolean {
  return isIosDevice();
}

/** Android phone/tablet (Chrome install prompt or menu fallback). */
export function isAndroidDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/i.test(window.navigator.userAgent);
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isBeforeInstallPromptEvent(e: Event): e is BeforeInstallPromptEvent {
  return "prompt" in e && typeof (e as BeforeInstallPromptEvent).prompt === "function";
}
