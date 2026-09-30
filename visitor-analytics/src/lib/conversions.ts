/** Path / event matching helpers for goals and funnel steps. */

export function normalizePath(path: string): string {
  if (!path) return "/";
  const p = path.startsWith("/") ? path : `/${path}`;
  return p.split("?")[0].split("#")[0] || "/";
}

export function matchesUrl(
  path: string,
  matchValue: string,
  matchMode: string
): boolean {
  const p = normalizePath(path);
  const m = normalizePath(matchValue);
  if (matchMode === "prefix") {
    if (p === m) return true;
    const prefix = m.endsWith("/") ? m : `${m}/`;
    return p.startsWith(prefix) || p.startsWith(m);
  }
  return p === m;
}

export function matchesEvent(
  eventName: string | null | undefined,
  matchValue: string
) {
  if (!eventName) return false;
  return eventName.trim().toLowerCase() === matchValue.trim().toLowerCase();
}

export type StepLike = {
  type: string;
  matchValue: string;
  matchMode: string;
};

export type EventLike = {
  type: string;
  path: string;
  eventName: string | null;
  sessionId: string;
  createdAt: Date;
};

function eventMatchesStep(ev: EventLike, step: StepLike): boolean {
  if (step.type === "event") {
    return matchesEvent(ev.eventName, step.matchValue);
  }
  return matchesUrl(ev.path, step.matchValue, step.matchMode);
}

/** Ordered funnel: sessions progressing through steps in time order. */
export function computeFunnelDropoff(
  steps: StepLike[],
  events: EventLike[]
): { sessions: number; dropoffRate: number | null }[] {
  if (steps.length === 0) return [];

  const bySession = new Map<string, EventLike[]>();
  for (const ev of events) {
    const list = bySession.get(ev.sessionId) ?? [];
    list.push(ev);
    bySession.set(ev.sessionId, list);
  }
  for (const list of bySession.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  // sessionId -> earliest time they completed the previous step
  let eligible = new Map<string, number>();
  for (const sid of bySession.keys()) {
    eligible.set(sid, -Infinity);
  }

  const counts: number[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const next = new Map<string, number>();

    for (const [sid, afterTime] of eligible) {
      const list = bySession.get(sid) ?? [];
      const hit = list.find(
        (ev) =>
          eventMatchesStep(ev, step) &&
          (i === 0
            ? true
            : ev.createdAt.getTime() > afterTime)
      );
      if (hit) {
        next.set(sid, hit.createdAt.getTime());
      }
    }

    counts.push(next.size);
    eligible = next;
  }

  return counts.map((sessions, i) => {
    const prev = i === 0 ? null : counts[i - 1];
    const dropoffRate =
      prev === null || prev === 0 ? null : 1 - sessions / prev;
    return { sessions, dropoffRate };
  });
}

export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
