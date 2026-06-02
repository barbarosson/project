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

/** Asking someone out, confessing feelings, or drafting a romantic approach message — not a dating-app bio. */
export function isRomanticAskOutIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(ask (them|her|him)?\s*out|ask on a date|have a crush|confess(ion)?|tell (her|him|them) i like|romantic feelings)\b/.test(
      t
    ) ||
    /\b(çıkma teklif|çıkmak istiyorum|çıkma teklifi|hoşlanıyorum|beğeniyorum|beğendiğim|seviyorum|aşığım|aşık oldum)\b/.test(
      t
    ) ||
    /\b(hislerimi|flört|teklif etmek|birine (söyle|yaz)|tanışmak istiyorum)\b/.test(t) ||
    /\b(pedirle salir|declarar(me)?|me gusta alguien|avouer)\b/.test(t)
  );
}

/** User pasted or wants help with a dating-app bio / profile — not general crush messaging. */
export function isDatingProfileIntent(text: string): boolean {
  const t = text.toLowerCase();
  return (
    /\b(bio|profile|tinder|bumble|hinge|dating app|match(es)?)\b/.test(t) ||
    /\b(biyografi|profil(im)?|flört uygulaması)\b/.test(t) ||
    /\b(roast my (bio|profile)|improve my bio)\b/.test(t)
  );
}

/** Tools that help draft sensitive romantic / social messages (not profile critique). */
export const ROMANTIC_MESSAGE_TOOLS = [
  "awkward-text-fixer",
  "delicate-truth",
  "relationship-repair-text",
] as const satisfies readonly ToolName[];

/** True when classifier suggestion and user selection both fit the same detected intent family. */
export function toolsAlignWithIntent(
  selected: ToolName,
  suggested: ToolName | "unknown" | undefined,
  rawInput: string
): boolean {
  if (!suggested || suggested === "unknown") return false;
  if (selected === suggested) return true;

  const inSet = (ids: readonly ToolName[]) => ids.includes(selected) && ids.includes(suggested);

  if (isRomanticAskOutIntent(rawInput) && !isDatingProfileIntent(rawInput)) {
    return inSet(ROMANTIC_MESSAGE_TOOLS);
  }
  if (isGiftMessageIntent(rawInput) && !isDefineRelationshipIntent(rawInput)) {
    return inSet(["awkward-text-fixer", "delicate-truth", "guilt-free-no"]);
  }
  if (isDefineRelationshipIntent(rawInput)) {
    return inSet(["relationship-define-the-talk", "delicate-truth", "awkward-text-fixer"]);
  }
  return false;
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

  if (isRomanticAskOutIntent(lastUser) && !isDatingProfileIntent(lastUser)) {
    return pick([...ROMANTIC_MESSAGE_TOOLS]);
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
  if (isRomanticAskOutIntent(lastUser) && !isDatingProfileIntent(lastUser)) {
    blocked.add("dating-roast");
    blocked.add("corporate-whisperer");
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
    isDefineRelationshipIntent(lastUser) ||
    isRomanticAskOutIntent(lastUser)
  );
}
