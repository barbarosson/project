import { apiOrigin, LOGIN_URL, PRICING_URL } from "./lib/config.js";
import { hasIsendaiSession } from "./lib/auth.js";
import { fetchWallet, generateMessage } from "./lib/api.js";

const CONTEXT_MENU_ID = "isendai-fix-selection";
const PENDING_TEXT_KEY = "pendingSelectionText";

function installContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Fix with isendai",
      contexts: ["selection"],
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  installContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  installContextMenu();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  const selection = typeof info.selectionText === "string" ? info.selectionText.trim() : "";
  if (!selection || !tab?.id) return;

  await chrome.storage.session.set({ [PENDING_TEXT_KEY]: selection });

  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "ISENDAI_SHOW_PANEL",
      text: selection,
    });
  } catch {
    // Content script not injected on this tab yet — open popup with pending text.
  }

  try {
    await chrome.action.openPopup();
  } catch {
    // openPopup unavailable (e.g. no active popup gesture in some builds) — panel or badge only.
  }
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type;

  if (type === "ISENDAI_GET_SESSION") {
    hasIsendaiSession()
      .then((signedIn) => sendResponse({ signedIn, origin: apiOrigin() }))
      .catch(() => sendResponse({ signedIn: false, origin: apiOrigin() }));
    return true;
  }

  if (type === "ISENDAI_GET_WALLET") {
    fetchWallet()
      .then((wallet) => sendResponse({ ok: true, wallet }))
      .catch((e) =>
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : "Could not load account.",
        })
      );
    return true;
  }

  if (type === "ISENDAI_GENERATE") {
    const { text, model, locale } = message;
    generateMessage({ text, model, locale })
      .then((out) => sendResponse(out))
      .catch((e) =>
        sendResponse({
          ok: false,
          error: e instanceof Error ? e.message : "Generation failed.",
        })
      );
    return true;
  }

  if (type === "ISENDAI_GET_PENDING_TEXT") {
    chrome.storage.session
      .get(PENDING_TEXT_KEY)
      .then((data) => sendResponse({ text: data[PENDING_TEXT_KEY] ?? "" }))
      .catch(() => sendResponse({ text: "" }));
    return true;
  }

  if (type === "ISENDAI_CLEAR_PENDING_TEXT") {
    chrome.storage.session
      .remove(PENDING_TEXT_KEY)
      .then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }

  if (type === "ISENDAI_OPEN_LOGIN") {
    chrome.tabs.create({ url: LOGIN_URL });
    sendResponse({ ok: true });
    return false;
  }

  if (type === "ISENDAI_OPEN_PRICING") {
    chrome.tabs.create({ url: PRICING_URL });
    sendResponse({ ok: true });
    return false;
  }

  return false;
});
