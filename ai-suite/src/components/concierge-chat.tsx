"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, SendHorizonal } from "lucide-react";

import type { ToolName } from "@/components/ai-suite/tools";
import { getToolDefinition } from "@/components/ai-suite/tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/i18n-provider";
import { IsendaiLogo } from "@/components/isendai-logo";
import { toolTitle } from "@/i18n/tool-i18n";

type UiMsg = { id: string; role: "assistant" | "user"; content: string };

type ApiResponse = { reply: string; suggested_tools: ToolName[] };

function renderMarkdownLinks(text: string) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = re.exec(text)) !== null) {
    const [full, label, href] = match;
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    const safeHref = typeof href === "string" && href.startsWith("/") ? href : null;
    if (safeHref) {
      parts.push(
        <a
          key={`${start}:${safeHref}`}
          href={safeHref}
          className="font-medium text-primary underline underline-offset-4"
        >
          {label}
        </a>
      );
    } else {
      parts.push(full);
    }
    lastIndex = start + full.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

export function ConciergeChat({ className }: { className?: string }) {
  const router = useRouter();
  const { t, locale } = useI18n();

  const [messages, setMessages] = React.useState<UiMsg[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: t("concierge.welcome"),
    },
  ]);
  const [suggested, setSuggested] = React.useState<ToolName[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setSuggested([]);
    setBusy(true);

    const userMsg: UiMsg = { id: crypto.randomUUID(), role: "user", content: text };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setInput("");

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          messages: nextMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const json = (await res.json()) as Partial<ApiResponse> & { error?: string };
      if (!res.ok) throw new Error(json?.error || "Chat failed.");
      if (!json.reply) throw new Error("No reply returned.");

      const assistantMsg: UiMsg = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: String(json.reply),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      const suggestedTools = Array.isArray(json.suggested_tools)
        ? (json.suggested_tools as ToolName[])
        : [];
      setSuggested(suggestedTools);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("bg-card/70 backdrop-blur", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          <IsendaiLogo
            withWordmark
            className="gap-2"
            iconClassName="size-6"
            wordmarkClassName="text-base"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="max-h-56 space-y-2 overflow-auto rounded-xl border bg-background/50 p-3 text-sm">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg border px-3 py-2",
                m.role === "user"
                  ? "ml-auto w-[92%] border-primary/30 bg-primary/10"
                  : "mr-auto w-[92%] border-border/60 bg-card"
              )}
            >
              <p className="whitespace-pre-wrap">
                {m.role === "assistant" ? renderMarkdownLinks(m.content) : m.content}
              </p>
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              {t("concierge.thinking")}
            </div>
          ) : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {suggested.length ? (
          <div className="flex flex-wrap gap-2">
            {suggested.map((tool) => (
              <Button
                key={tool}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => router.replace(`/?tool=${tool}`)}
              >
                <span className="mr-1" aria-hidden="true">
                  {getToolDefinition(tool).emoji}
                </span>
                {toolTitle(t, tool, getToolDefinition(tool).title)} <ArrowRight className="size-4" />
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("concierge.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            disabled={busy}
          />
          <Button type="button" onClick={send} disabled={busy || !input.trim()}>
            <SendHorizonal className="size-4" />
            {t("concierge.send")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

