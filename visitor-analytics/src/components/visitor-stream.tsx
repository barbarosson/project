"use client";

import { useCallback, useEffect, useState } from "react";

type StreamSession = {
  sessionId: string;
  visitorId: string;
  siteId: string;
  siteName: string;
  lastPath: string;
  lastType: string;
  eventName: string | null;
  deviceClass: string | null;
  pageviews: number;
  lastSeenAt: string;
  startedAt: string;
};

type StreamItem = {
  id: string;
  type: string;
  path: string;
  eventName: string | null;
  visitorId: string;
  sessionId: string;
  deviceClass: string | null;
  utmSource: string | null;
  siteId: string;
  siteName: string;
  createdAt: string;
};

export function VisitorStream({
  siteId,
  pollMs = 8000,
}: {
  siteId?: string;
  pollMs?: number;
}) {
  const [sessions, setSessions] = useState<StreamSession[]>([]);
  const [items, setItems] = useState<StreamItem[]>([]);
  const [polledAt, setPolledAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    if (!live) return;
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const qs = new URLSearchParams({
      since,
      limit: "50",
    });
    if (siteId) qs.set("siteId", siteId);
    try {
      const res = await fetch(`/api/stream?${qs}`);
      if (!res.ok) {
        setError("Could not load stream");
        return;
      }
      const data = await res.json();
      setSessions(data.sessions || []);
      setItems(data.items || []);
      setPolledAt(data.polledAt);
      setError(null);
    } catch {
      setError("Network error");
    }
  }, [siteId, live]);

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs);
    return () => clearInterval(t);
  }, [load, pollMs]);

  return (
    <section className="sp-card space-y-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Visitor stream</h2>
          <p className="text-sm text-[var(--muted)]">
            Near-realtime (polls every {Math.round(pollMs / 1000)}s). Last hour.
            {polledAt ? (
              <>
                {" "}
                Updated{" "}
                {new Date(polledAt).toISOString().replace("T", " ").slice(11, 19)}{" "}
                UTC
              </>
            ) : null}
          </p>
        </div>
        <button
          type="button"
          className="sp-btn sp-btn-ghost !py-1.5 !text-sm"
          onClick={() => setLive((v) => !v)}
        >
          {live ? "Pause" : "Resume"}
        </button>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
            Active sessions
          </h3>
          {sessions.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No recent sessions.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {sessions.map((s) => (
                <li
                  key={`${s.siteId}:${s.sessionId}`}
                  className="rounded-lg border border-[var(--line)] bg-[var(--bg)] px-3 py-2"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold">{s.siteName}</span>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(s.lastSeenAt)
                        .toISOString()
                        .replace("T", " ")
                        .slice(11, 19)}
                    </span>
                  </div>
                  <div className="font-mono text-xs">
                    {s.lastType === "event"
                      ? `event:${s.eventName}`
                      : s.lastPath}
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    visitor {s.visitorId.slice(0, 8)}… · {s.pageviews} PV ·{" "}
                    {s.deviceClass ?? "unknown"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold text-[var(--muted)]">
            Event feed
          </h3>
          {items.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No recent events.</p>
          ) : (
            <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
              {items.map((ev) => (
                <li
                  key={ev.id}
                  className="border-b border-[var(--line)] pb-2 last:border-0"
                >
                  <div className="flex justify-between gap-2">
                    <span className="font-mono text-xs">
                      {ev.type === "event"
                        ? `event:${ev.eventName}`
                        : ev.path}
                    </span>
                    <span className="text-xs text-[var(--muted)]">
                      {new Date(ev.createdAt)
                        .toISOString()
                        .replace("T", " ")
                        .slice(11, 19)}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--muted)]">
                    {ev.siteName}
                    {ev.utmSource ? ` · utm:${ev.utmSource}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
