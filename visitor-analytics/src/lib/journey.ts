/**
 * First-touch / customer journey helpers.
 * Privacy-honest: cookieless mode uses best-effort same-day visitor hashes —
 * journeys are incomplete across days and never reveal companies/people.
 */

export type JourneyEvent = {
  id: string;
  type: string;
  path: string;
  eventName: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  visitorId: string;
  sessionId: string;
  createdAt: Date;
};

export type JourneyConversion = {
  goalName: string;
  path: string | null;
  eventName: string | null;
  createdAt: Date;
  sessionId: string;
  visitorId: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
};

export type JourneyRow = {
  key: string;
  kind: "session" | "visitor";
  visitorId: string;
  sessionId: string;
  firstTouch: {
    source: string;
    referrer: string | null;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    at: Date;
  };
  pages: { path: string; at: Date; type: string; eventName: string | null }[];
  conversion: {
    goalName: string;
    at: Date;
    path: string | null;
    eventName: string | null;
  } | null;
  identityNote: string;
};

function sourceLabel(ev: {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
}): string {
  if (ev.utmSource) {
    return ev.utmMedium
      ? `${ev.utmSource} / ${ev.utmMedium}`
      : ev.utmSource;
  }
  if (ev.referrer) {
    try {
      return new URL(ev.referrer).hostname.replace(/^www\./, "");
    } catch {
      return "referrer";
    }
  }
  return "direct / unknown";
}

export function buildJourneys(opts: {
  events: JourneyEvent[];
  conversions: JourneyConversion[];
  identityMode: string;
  limit?: number;
}): JourneyRow[] {
  const limit = opts.limit ?? 20;
  const bySession = new Map<string, JourneyEvent[]>();
  for (const ev of opts.events) {
    const list = bySession.get(ev.sessionId) ?? [];
    list.push(ev);
    bySession.set(ev.sessionId, list);
  }
  for (const list of bySession.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const convBySession = new Map<string, JourneyConversion>();
  for (const c of opts.conversions) {
    const prev = convBySession.get(c.sessionId);
    if (!prev || c.createdAt < prev.createdAt) {
      convBySession.set(c.sessionId, c);
    }
  }

  // Prefer sessions that converted; then recent sessions with 2+ steps
  const sessionIds = [...bySession.keys()].sort((a, b) => {
    const ca = convBySession.has(a) ? 1 : 0;
    const cb = convBySession.has(b) ? 1 : 0;
    if (ca !== cb) return cb - ca;
    const la = bySession.get(a)!.at(-1)!.createdAt.getTime();
    const lb = bySession.get(b)!.at(-1)!.createdAt.getTime();
    return lb - la;
  });

  const cookieless = opts.identityMode === "cookieless";
  const identityNote = cookieless
    ? "Cookieless site: visitor IDs are best-effort same-day hashes — journeys may break across days. No company or person reveal."
    : "First-party cookie identity within this site only. No organization or person enrichment.";

  const rows: JourneyRow[] = [];
  for (const sid of sessionIds) {
    if (rows.length >= limit) break;
    const events = bySession.get(sid)!;
    if (events.length === 0) continue;
    const first = events[0];
    const conv = convBySession.get(sid) ?? null;
    rows.push({
      key: sid,
      kind: "session",
      visitorId: first.visitorId,
      sessionId: sid,
      firstTouch: {
        source: sourceLabel(first),
        referrer: first.referrer,
        utmSource: first.utmSource,
        utmMedium: first.utmMedium,
        utmCampaign: first.utmCampaign,
        at: first.createdAt,
      },
      pages: events.map((e) => ({
        path: e.type === "event" ? `event:${e.eventName}` : e.path,
        at: e.createdAt,
        type: e.type,
        eventName: e.eventName,
      })),
      conversion: conv
        ? {
            goalName: conv.goalName,
            at: conv.createdAt,
            path: conv.path,
            eventName: conv.eventName,
          }
        : null,
      identityNote,
    });
  }

  return rows;
}
