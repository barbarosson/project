import { TOOLS, type ToolName } from "@/components/ai-suite/tools";

/** User wants to ask someone what gift they want / rewrite an awkward gift message. */
export function isGiftMessageIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(gift|gifts|present|presents|hediye|hediyeler|sürpriz|regalo|cadeau|geschenk)\b/.test(t) ||
    (/\b(alma|almak|buy|buying|get you|sana)\b/.test(t) && /\b(hediye|gift|present)\b/.test(t)) ||
    /\b(ne istediğini|ne istiyorsun|what you want|qué quieres)\b/.test(t)
  );
}

/** "What are we?" / define-the-relationship conversation — not general relationship texting. */
export function isDefineRelationshipIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(what are we|define the relationship|dtr\b|relationship status|are we dating)\b/.test(t) ||
    /\b(neyiz|ilişki(miz)? tanımla|ilişkiyi tanımla|resmi mi|exclusive)\b/.test(t) ||
    /\b(qué somos|definir la relación)\b/.test(t) ||
    /\b(qu'est-ce qu'on est|définir la relation)\b/.test(t) ||
    /\b(was sind wir|beziehung definieren)\b/.test(t) ||
    /我们是什么|定义关系/.test(text)
  );
}

function hasTool(id: ToolName): boolean {
  return TOOLS.some((x) => x.tool === id);
}

function pick(ids: ToolName[]): ToolName[] {
  return ids.filter(hasTool).slice(0, 3);
}

/** Ranked tool ids for concierge suggestions and scope alignment. */
export function rankToolsForUserIntent(lastUser: string): ToolName[] {
  const t = lastUser.toLowerCase();

  if (isDefineRelationshipIntent(lastUser)) {
    return pick(["relationship-define-the-talk", "delicate-truth", "awkward-text-fixer"]);
  }

  if (isGiftMessageIntent(lastUser)) {
    return pick(["awkward-text-fixer", "delicate-truth", "guilt-free-no"]);
  }

  if (/\b(apolog|sorry|repair|make up)\b/.test(t) || /\b(özür|pardon|telafi|barış)\b/.test(t)) {
    return pick(["perfect-apology", "apology-repair-plan", "relationship-repair-text"]);
  }

  if (/\b(boss|manager|client|email|work)\b/.test(t) || /\b(iş|mail|e-?posta|patron|müşteri)\b/.test(t)) {
    return pick(["corporate-whisperer", "deadline-diplomat", "micromanager-tamer"]);
  }

  if (
    /\b(wife|husband|girlfriend|boyfriend|partner|spouse|anniversary|valentine)\b/.test(t) ||
    /\b(eşim|karım|kocam|sevgilim|partnerim|yıldönümü|doğum\s*günü)\b/.test(t)
  ) {
    return pick(["awkward-text-fixer", "delicate-truth", "guilt-free-no"]);
  }

  if (
    /\b(message|text|write|rewrite|draft|ask)\b/.test(t) ||
    /\b(mesaj|yaz|yazmak|metin|dm|sor|sormak|söyle|rica)\b/.test(t) ||
    /\b(mensaje|escribir|texto|correo)\b/.test(t) ||
    /\b(message|écrire|texte|courriel)\b/.test(t) ||
    /\b(nachricht|text|schreib|mail)\b/.test(t) ||
    /消息|短信|写|邮件/.test(lastUser)
  ) {
    return pick(["awkward-text-fixer", "delicate-truth", "guilt-free-no"]);
  }

  return pick(["awkward-text-fixer", "corporate-whisperer", "delicate-truth"]);
}

/** Drop tools that contradict detected intent; fill from ranked list if empty. */
export function alignSuggestedTools(lastUser: string, suggested: ToolName[]): ToolName[] {
  const ranked = rankToolsForUserIntent(lastUser);
  const blocked = new Set<ToolName>();

  if (isGiftMessageIntent(lastUser) && !isDefineRelationshipIntent(lastUser)) {
    blocked.add("relationship-define-the-talk");
  }
  if (isDefineRelationshipIntent(lastUser) && !isGiftMessageIntent(lastUser)) {
    // keep DTR tool; no block
  }

  const filtered = suggested.filter((id) => !blocked.has(id));
  const merged: ToolName[] = [];
  for (const id of [...filtered, ...ranked]) {
    if (!merged.includes(id)) merged.push(id);
    if (merged.length >= 3) break;
  }
  return merged;
}

export function looksLikeToolableMessageRequest(lastUser: string): boolean {
  const t = lastUser.toLowerCase();
  return (
    /\b(message|text|dm|email|write|rewrite|draft)\b/.test(t) ||
    /\b(ask|how do i ask|how can i ask|how to ask|politely)\b/.test(t) ||
    /\b(mesaj|yaz|yazmak|metin|dm|e-?posta|mail)\b/.test(t) ||
    /\b(sor|sormak|söyle|nasıl sor|kibarca|rica)\b/.test(t) ||
    /\b(mensaje|escribir|texto|correo)\b/.test(t) ||
    /\b(message|écrire|texte|courriel)\b/.test(t) ||
    /\b(nachricht|text|schreib|mail)\b/.test(t) ||
    /消息|短信|写|邮件/.test(lastUser) ||
    isGiftMessageIntent(lastUser) ||
    isDefineRelationshipIntent(lastUser)
  );
}
