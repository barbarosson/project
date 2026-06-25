type CredentialResponse = { credential?: string };

type GoogleIdApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    use_fedcm_for_prompt?: boolean;
    locale?: string;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
      shape?: string;
      logo_alignment?: string;
    }
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

let scriptPromise: Promise<void> | null = null;

/** Map app locale to Google Identity Services `locale` / `hl` codes. */
export function googleGisLocale(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  if (normalized === "zh") return "zh-CN";
  return normalized || "en";
}

/** Web client id from Google Cloud (not the client secret). */
export function isValidGoogleOAuthClientId(id: string): boolean {
  return /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i.test(id.trim());
}

export function getGoogleOAuthClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim();
  if (!id) return null;
  if (!isValidGoogleOAuthClientId(id)) return null;
  return id;
}

/** True when env is set but not a valid Google Web Client ID (common Netlify typo). */
export function hasInvalidGoogleOAuthClientIdEnv(): boolean {
  const raw = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim();
  return Boolean(raw && !isValidGoogleOAuthClientId(raw));
}

export function loadGoogleGsiScript(locale?: string): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in requires a browser."));
  }
  if (window.google?.accounts?.id) return Promise.resolve();

  const hl = locale ? googleGisLocale(locale) : null;
  const scriptUrl = hl
    ? `https://accounts.google.com/gsi/client?hl=${encodeURIComponent(hl)}`
    : "https://accounts.google.com/gsi/client";

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${scriptUrl}"]`);
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve();
          return;
        }
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Google script failed to load")),
          { once: true }
        );
        return;
      }
      const script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Google script failed to load"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

function idApi(): GoogleIdApi {
  const api = window.google?.accounts?.id;
  if (!api) throw new Error("Google Identity Services not ready");
  return api;
}

/**
 * Renders the official Google button inside `parent` (no One Tap floater).
 * Returns dispose cleanup.
 */
export async function mountGoogleSignInButton(
  parent: HTMLElement,
  clientId: string,
  handlers: {
    onCredential: (token: string) => void;
    onReady?: () => void;
    onError?: (error: Error) => void;
  },
  locale?: string
): Promise<() => void> {
  const gisLocale = locale ? googleGisLocale(locale) : undefined;
  await loadGoogleGsiScript(gisLocale);
  parent.replaceChildren();

  idApi().initialize({
    client_id: clientId,
    auto_select: false,
    cancel_on_tap_outside: false,
    use_fedcm_for_prompt: true,
    ...(gisLocale ? { locale: gisLocale } : {}),
    callback: (response) => {
      const cred = response.credential?.trim();
      if (cred) handlers.onCredential(cred);
      else handlers.onError?.(new Error("Google returned no credential"));
    },
  });

  idApi().renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "continue_with",
    shape: "pill",
    logo_alignment: "left",
    width: Math.min(400, Math.max(280, parent.clientWidth || 320)),
  });

  handlers.onReady?.();

  return () => parent.replaceChildren();
}

/** @deprecated Prefer mountGoogleSignInButton on /auth/connecting */
export async function acquireGoogleIdToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-9999px";
    document.body.appendChild(host);
    void mountGoogleSignInButton(host, clientId, {
      onCredential: (token) => {
        host.remove();
        resolve(token);
      },
      onError: (e) => {
        host.remove();
        reject(e);
      },
    }).catch((e) => {
      host.remove();
      reject(e);
    });
  });
}
