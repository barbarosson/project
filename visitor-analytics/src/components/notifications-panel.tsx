"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Note = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsPanel({ initial }: { initial: Note[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const unread = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    const res = await fetch("/api/org/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      setItems((list) =>
        list.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }))
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--muted)]">
          In-app digests, quota warnings, and traffic spikes.
          {unread > 0 ? ` ${unread} unread.` : ""} Outbound email runs only when{" "}
          <code>RESEND_API_KEY</code> or <code>SMTP_HOST</code> is set; otherwise
          the weekly script queues/logs a stub.
        </p>
        {unread > 0 && (
          <button
            type="button"
            className="sp-btn sp-btn-ghost !text-sm"
            onClick={markAllRead}
          >
            Mark all read
          </button>
        )}
      </div>
      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="sp-card p-5 text-sm text-[var(--muted)]">
            No notifications yet. Run{" "}
            <code className="text-xs">npm run digest:weekly -- --force</code>{" "}
            locally to generate a digest.
          </li>
        )}
        {items.map((n) => (
          <li
            key={n.id}
            className="sp-card p-5"
            style={{
              opacity: n.readAt ? 0.75 : 1,
              borderColor: n.readAt ? undefined : "var(--brand)",
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">{n.title}</h2>
              <span className="text-xs uppercase tracking-wide text-[var(--muted)]">
                {n.type.replace(/_/g, " ")}
              </span>
            </div>
            <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-[var(--muted)]">
              {n.body}
            </pre>
            <p className="mt-2 text-xs text-[var(--muted)]">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
