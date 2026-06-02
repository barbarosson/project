/**
 * In-page panel for “Fix with isendai” context menu flow.
 * Full UI lives in popup.html; this panel shows quick results on Gmail, LinkedIn, X, etc.
 */

const ROOT_ID = "isendai-extension-root";

function removePanel() {
  document.getElementById(ROOT_ID)?.remove();
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showPanel({ title, bodyHtml, showCopy = false, onCopy, onOpenPopup }) {
  removePanel();

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.innerHTML = `
    <div class="isendai-panel" role="dialog" aria-label="isendai">
      <div class="isendai-panel-header">
        <span class="isendai-title">${escapeHtml(title)}</span>
        <button type="button" class="isendai-close" aria-label="Close">✕</button>
      </div>
      <div class="isendai-body">${bodyHtml}</div>
      <div class="isendai-actions">
        ${
          showCopy
            ? '<button type="button" class="isendai-btn-secondary" data-action="copy">Copy</button>'
            : ""
        }
        <button type="button" class="isendai-btn-primary" data-action="popup">Open extension</button>
      </div>
    </div>
  `;

  document.documentElement.appendChild(root);

  root.querySelector(".isendai-close")?.addEventListener("click", removePanel);
  root.querySelector('[data-action="copy"]')?.addEventListener("click", () => {
    void onCopy?.();
  });
  root.querySelector('[data-action="popup"]')?.addEventListener("click", () => {
    void onOpenPopup?.();
    removePanel();
  });
}

function sendMessage(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function runQuickFix(text) {
  showPanel({
    title: "isendai",
    bodyHtml: '<p class="isendai-muted">Fixing your message…</p>',
  });

  const session = await sendMessage({ type: "ISENDAI_GET_SESSION" });
  if (!session?.signedIn) {
    showPanel({
      title: "Sign in required",
      bodyHtml:
        '<p class="isendai-error">Please login to your isendai account, then try again.</p>',
      onOpenPopup: () => sendMessage({ type: "ISENDAI_OPEN_LOGIN" }),
    });
    return;
  }

  const out = await sendMessage({
    type: "ISENDAI_GENERATE",
    text,
    model: "fast-ai",
    locale: "en",
  });

  if (out?.authRequired) {
    showPanel({
      title: "Sign in required",
      bodyHtml:
        '<p class="isendai-error">Please login to your isendai account.</p>',
      onOpenPopup: () => sendMessage({ type: "ISENDAI_OPEN_LOGIN" }),
    });
    return;
  }

  if (!out?.ok) {
    const hint = out?.insufficientCredits
      ? " Top up credits at isendai.com/pricing."
      : "";
    showPanel({
      title: "Could not fix",
      bodyHtml: `<p class="isendai-error">${escapeHtml((out?.error ?? "Generation failed.") + hint)}</p>`,
      onOpenPopup: () =>
        sendMessage({
          type: out?.insufficientCredits ? "ISENDAI_OPEN_PRICING" : "ISENDAI_OPEN_LOGIN",
        }),
    });
    return;
  }

  const result = out.result ?? "";
  showPanel({
    title: "Fixed message",
    bodyHtml: escapeHtml(result),
    showCopy: true,
    onCopy: async () => {
      try {
        await navigator.clipboard.writeText(result);
      } catch {
        // fallback: user can select from panel
      }
    },
    onOpenPopup: async () => {
      await sendMessage({ type: "ISENDAI_GET_PENDING_TEXT" });
    },
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== "ISENDAI_SHOW_PANEL") return;
  const text = typeof message.text === "string" ? message.text.trim() : "";
  if (!text) return;
  void runQuickFix(text);
});
