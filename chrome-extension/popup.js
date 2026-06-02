import { PRICING_URL } from "./lib/config.js";

const $ = (id) => document.getElementById(id);

const authBanner = $("auth-banner");
const inputText = $("input-text");
const inputModel = $("input-model");
const btnGenerate = $("btn-generate");
const btnCopy = $("btn-copy");
const btnLogin = $("btn-login");
const btnTopup = $("btn-topup");
const resultWrap = $("result-wrap");
const resultText = $("result-text");
const statusEl = $("status");
const creditsDisplay = $("credits-display");
const accountEmail = $("account-email");

let signedIn = false;
let lastResult = "";

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = `status${kind ? ` ${kind}` : ""}`;
}

function sendMessage(msg) {
  return chrome.runtime.sendMessage(msg);
}

function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  const panels = {
    generate: $("panel-generate"),
    account: $("panel-account"),
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.dataset.tab;
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      Object.entries(panels).forEach(([key, el]) => {
        el.classList.toggle("active", key === name);
      });
      if (name === "account" && signedIn) void loadWallet();
    });
  });
}

function setSignedInUI(isSignedIn) {
  signedIn = isSignedIn;
  authBanner.classList.toggle("hidden", isSignedIn);
  btnGenerate.disabled = !isSignedIn;
  inputText.disabled = !isSignedIn;
  inputModel.disabled = !isSignedIn;
  if (!isSignedIn) {
    creditsDisplay.textContent = "—";
    accountEmail.textContent = "";
  }
}

async function checkSession() {
  const { signedIn: ok } = await sendMessage({ type: "ISENDAI_GET_SESSION" });
  setSignedInUI(Boolean(ok));
  return Boolean(ok);
}

async function loadWallet() {
  if (!signedIn) return;
  setStatus("Loading account…");
  const res = await sendMessage({ type: "ISENDAI_GET_WALLET" });
  if (!res?.ok) {
    if (res?.error?.includes("401") || res?.error?.toLowerCase?.().includes("sign")) {
      setSignedInUI(false);
    }
    setStatus(res?.error ?? "Could not load credits.", "error");
    return;
  }
  const w = res.wallet;
  if (!w?.signed_in) {
    setSignedInUI(false);
    setStatus("Please login to your isendai account.", "error");
    return;
  }
  creditsDisplay.textContent =
    w.credits != null ? String(w.credits) : "0";
  accountEmail.textContent = w.email ? `Signed in as ${w.email}` : "";
  setStatus("");
}

async function loadPendingSelection() {
  const { text } = await sendMessage({ type: "ISENDAI_GET_PENDING_TEXT" });
  if (text?.trim()) {
    inputText.value = text.trim();
    await sendMessage({ type: "ISENDAI_CLEAR_PENDING_TEXT" });
    setStatus("Loaded text from your selection.", "success");
  }
}

async function runGenerate() {
  const text = inputText.value.trim();
  if (!text) {
    setStatus("Paste a message to fix first.", "error");
    return;
  }
  if (!signedIn) {
    setStatus("Please login to your isendai account.", "error");
    return;
  }

  btnGenerate.disabled = true;
  setStatus("Generating…");
  resultWrap.classList.add("hidden");

  const out = await sendMessage({
    type: "ISENDAI_GENERATE",
    text,
    model: inputModel.value,
    locale: "en",
  });

  btnGenerate.disabled = false;

  if (out?.authRequired) {
    setSignedInUI(false);
    setStatus("Please login to your isendai account.", "error");
    return;
  }

  if (out?.insufficientCredits) {
    setStatus(out.error ?? "Not enough credits.", "error");
    void loadWallet();
    return;
  }

  if (!out?.ok) {
    setStatus(out?.error ?? "Generation failed.", "error");
    return;
  }

  lastResult = out.result ?? "";
  resultText.textContent = lastResult;
  resultWrap.classList.remove("hidden");
  setStatus("Done — copy or paste into your compose box.", "success");
  void loadWallet();
}

async function copyResult() {
  if (!lastResult) return;
  try {
    await navigator.clipboard.writeText(lastResult);
    setStatus("Copied to clipboard.", "success");
  } catch {
    setStatus("Could not copy — select the result and copy manually.", "error");
  }
}

btnGenerate.addEventListener("click", () => void runGenerate());
btnCopy.addEventListener("click", () => void copyResult());
btnLogin.addEventListener("click", () => {
  void sendMessage({ type: "ISENDAI_OPEN_LOGIN" });
});
btnTopup.addEventListener("click", () => {
  chrome.tabs.create({ url: PRICING_URL });
});

setupTabs();

(async function init() {
  const ok = await checkSession();
  await loadPendingSelection();
  if (ok) await loadWallet();
})();
