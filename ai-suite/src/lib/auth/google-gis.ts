type CredentialResponse = { credential?: string };

type PromptNotification = {
  isDisplayMoment: () => boolean;
  isDisplayed: () => boolean;
  isNotDisplayed: () => boolean;
  getNotDisplayedReason: () => string;
  isSkippedMoment: () => boolean;
  getSkippedReason: () => string;
};

type GoogleIdApi = {
  initialize: (config: {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  prompt: (listener?: (n: PromptNotification) => void) => void;
  renderButton: (
    parent: HTMLElement,
    options: { type?: string; theme?: string; size?: string; text?: string; width?: number }
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } };
  }
}

let scriptPromise: Promise<void> | null = null;

export function getGoogleOAuthClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function loadGoogleGsiScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google sign-in requires a browser."));
  }
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
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
      script.src = "https://accounts.google.com/gsi/client";
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

/** One Tap / account chooser — must run in a user click handler when possible. */
export function promptGoogleIdToken(clientId: string): Promise<string> {
  return loadGoogleGsiScript().then(
    () =>
      new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        const timeout = window.setTimeout(() => {
          finish(() => reject(new Error("Google sign-in timed out")));
        }, 120_000);

        idApi().initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: (response) => {
            window.clearTimeout(timeout);
            const cred = response.credential?.trim();
            if (cred) {
              finish(() => resolve(cred));
            } else {
              finish(() => reject(new Error("Google returned no credential")));
            }
          },
        });

        idApi().prompt((notification) => {
          if (!notification.isNotDisplayed() && !notification.isSkippedMoment()) return;
          const reason =
            notification.getNotDisplayedReason?.() || notification.getSkippedReason?.() || "unknown";
          window.clearTimeout(timeout);
          finish(() => reject(new Error(`google_prompt_unavailable:${reason}`)));
        });
      })
  );
}

/** Fallback when One Tap is blocked — renders official Google button and waits for callback. */
export function renderGoogleSignInButton(clientId: string): Promise<string> {
  return loadGoogleGsiScript().then(
    () =>
      new Promise((resolve, reject) => {
        const host = document.createElement("div");
        host.style.position = "fixed";
        host.style.inset = "0";
        host.style.zIndex = "9999";
        host.style.display = "flex";
        host.style.alignItems = "center";
        host.style.justifyContent = "center";
        host.style.background = "rgba(15,23,42,0.75)";
        host.style.backdropFilter = "blur(4px)";
        const panel = document.createElement("div");
        panel.style.padding = "24px";
        panel.style.borderRadius = "16px";
        panel.style.background = "#0f172a";
        host.appendChild(panel);
        document.body.appendChild(host);

        const cleanup = () => host.remove();

        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("Google sign-in timed out"));
        }, 120_000);

        idApi().initialize({
          client_id: clientId,
          callback: (response) => {
            window.clearTimeout(timeout);
            cleanup();
            const cred = response.credential?.trim();
            if (cred) resolve(cred);
            else reject(new Error("Google returned no credential"));
          },
        });

        idApi().renderButton(panel, {
          type: "standard",
          theme: "filled_blue",
          size: "large",
          text: "continue_with",
          width: 320,
        });
      })
  );
}

export async function acquireGoogleIdToken(clientId: string): Promise<string> {
  try {
    return await promptGoogleIdToken(clientId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("google_prompt_unavailable:")) {
      return renderGoogleSignInButton(clientId);
    }
    throw e;
  }
}
