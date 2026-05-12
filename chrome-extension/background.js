/**
 * isendai Chrome extension — Manifest V3 service worker.
 * Right-click selected text → Refine with isendai → opens the web app with ?text=...
 */

const SITE_ORIGIN = "https://isendai.netlify.app";

const MENU_ROOT = "isendai-root";

/** Maps context menu entry ids to Next.js tool route segments. */
const MENU_ITEMS = [
  {
    id: "isendai-corporate-whisperer",
    toolId: "corporate-whisperer",
    title: "Corporate Whisperer (Work)",
  },
  {
    id: "isendai-perfect-apology",
    toolId: "perfect-apology",
    title: "The Perfect Apology (Crisis)",
  },
  {
    id: "isendai-ghosting-resurrector",
    toolId: "ghosting-resurrector",
    title: "Ghosting Resurrector (Social)",
  },
];

function buildToolUrl(toolId, selectionText) {
  const text = encodeURIComponent(selectionText);
  return `${SITE_ORIGIN}/tool/${encodeURIComponent(toolId)}?text=${text}`;
}

function installMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: MENU_ROOT,
      title: "Refine with isendai",
      contexts: ["selection"],
    });
    for (const item of MENU_ITEMS) {
      chrome.contextMenus.create({
        id: item.id,
        parentId: MENU_ROOT,
        title: item.title,
        contexts: ["selection"],
      });
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  installMenus();
});

chrome.contextMenus.onClicked.addListener((info) => {
  const entry = MENU_ITEMS.find((x) => x.id === info.menuItemId);
  const selection = typeof info.selectionText === "string" ? info.selectionText : "";
  if (!entry || selection.length === 0) return;

  const url = buildToolUrl(entry.toolId, selection);
  chrome.tabs.create({ url });
});
