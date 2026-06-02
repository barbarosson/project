import { TOOLS, type ToolName } from "@/components/ai-suite/tools";
import {
  isDefineRelationshipIntent,
  isDatingProfileIntent,
  isGiftMessageIntent,
  isRomanticAskOutIntent,
  rankToolsForUserIntent,
} from "@/lib/intent-tool-routing";

function isToolName(value: string): value is ToolName {
  return TOOLS.some((t) => t.tool === value);
}

/** Parse `[label](/?tool=tool-id)` links from concierge reply markdown. */
export function extractToolIdsFromConciergeReply(reply: string): ToolName[] {
  const found: ToolName[] = [];
  const re = /\]\(\/?\?tool=([a-z0-9-]+)\)/gi;
  let match: RegExpExecArray | null = null;
  while ((match = re.exec(reply)) !== null) {
    const id = match[1];
    if (isToolName(id) && !found.includes(id)) found.push(id);
  }
  return found;
}

function blockedToolsForIntent(lastUser: string): Set<ToolName> {
  const blocked = new Set<ToolName>();

  if (isGiftMessageIntent(lastUser) && !isDefineRelationshipIntent(lastUser)) {
    blocked.add("relationship-define-the-talk");
  }
  if (isRomanticAskOutIntent(lastUser) && !isDatingProfileIntent(lastUser)) {
    blocked.add("dating-roast");
    blocked.add("corporate-whisperer");
    blocked.add("relationship-define-the-talk");
  }
  return blocked;
}

/** Filter invalid/blocked tools; never pad with extra ranked tools. */
export function filterSuggestedToolsForIntent(lastUser: string, suggested: ToolName[]): ToolName[] {
  const blocked = blockedToolsForIntent(lastUser);
  const seen = new Set<ToolName>();
  const out: ToolName[] = [];
  for (const id of suggested) {
    if (!isToolName(id) || blocked.has(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= 3) break;
  }
  return out;
}

function toolsMentionedInReply(
  reply: string,
  candidates: ToolName[],
  resolveLabel: (tool: ToolName) => string
): ToolName[] {
  const lower = reply.toLowerCase();
  const hits: { tool: ToolName; index: number }[] = [];
  for (const tool of candidates) {
    const label = resolveLabel(tool).trim();
    if (label.length < 3) continue;
    const idx = lower.indexOf(label.toLowerCase());
    if (idx >= 0) hits.push({ tool, index: idx });
  }
  hits.sort((a, b) => a.index - b.index);
  const out: ToolName[] = [];
  for (const h of hits) {
    if (!out.includes(h.tool)) out.push(h.tool);
  }
  return out;
}

/**
 * Bottom tool chips must match the assistant reply — no extra tools from intent ranking.
 */
export function finalizeConciergeSuggestions(
  lastUser: string,
  reply: string,
  llmSuggested: ToolName[],
  resolveLabel: (tool: ToolName) => string
): ToolName[] {
  const fromLinks = extractToolIdsFromConciergeReply(reply);
  const llmClean = filterSuggestedToolsForIntent(lastUser, llmSuggested);
  const mentionCandidates =
    llmClean.length > 0 ? llmClean : rankToolsForUserIntent(lastUser).slice(0, 6);
  const fromMentions = toolsMentionedInReply(reply, mentionCandidates, resolveLabel);

  let base: ToolName[];
  if (fromLinks.length > 0) {
    base = fromLinks;
  } else if (fromMentions.length > 0) {
    base = fromMentions;
  } else if (llmClean.length > 0) {
    base = llmClean;
  } else {
    base = filterSuggestedToolsForIntent(lastUser, rankToolsForUserIntent(lastUser));
  }

  return filterSuggestedToolsForIntent(lastUser, base);
}
