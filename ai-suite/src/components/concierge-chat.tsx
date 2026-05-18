"use client";

import * as React from "react";
import { ArrowRight, Loader2, SendHorizonal } from "lucide-react";

import { sectionPanelViolet } from "@/lib/premium-ui";

import type { ToolName } from "@/components/ai-suite/tools";
import { getToolDefinition, isToolName } from "@/components/ai-suite/tools";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
import { useI18n } from "@/i18n/i18n-provider";
import { IsendaiLogo } from "@/components/isendai-logo";
import { toolTitle } from "@/i18n/tool-i18n";

type UiMsg = { id: string; role: "assistant" | "user"; content: string };

type ApiResponse = { reply: string; suggested_tools: ToolName[] };

const WELCOME_TOKEN = "__ISENDAI_WELCOME__";

function toolFromInternalHref(href: string): ToolName | null {
  try {
    const u = new URL(href, "https://isendai.local");
    const tool = u.searchParams.get("tool");
    return isToolName(tool) ? tool : null;
  } catch {
    return null;
  }
}

function renderMarkdownLinks(
  text: string,
  onOpenTool?: (tool: ToolName) => void
) {
  const parts: React.ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = re.exec(text)) !== null) {
    const [full, label, href] = match;
    const start = match.index;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));

    const safeHref = typeof href === "string" && href.startsWith("/") ? href : null;
    const toolId = safeHref ? toolFromInternalHref(safeHref) : null;
    if (safeHref && toolId && onOpenTool) {
      parts.push(
        <button
          key={`${start}:${safeHref}`}
          type="button"
          onClick={() => onOpenTool(toolId)}
          className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
        >
          {label}
        </button>
      );
    } else if (safeHref) {
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

export function ConciergeChat({
  className,
  onOpenTool,
}: {
  className?: string;
  /** Open the workspace tool panel (and optional draft prefill from the last user message). */
  onOpenTool?: (tool: ToolName, opts?: { draftText?: string; scroll?: boolean }) => void;
}) {
  const { t, locale } = useI18n();

  const [messages, setMessages] = React.useState<UiMsg[]>(() => [
    {
      id: crypto.randomUUID(),
      role: "assistant",
      content: WELCOME_TOKEN,
    },
  ]);
  const [suggested, setSuggested] = React.useState<ToolName[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastUserDraftRef = React.useRef("");

  function openSuggestedTool(tool: ToolName, scroll = true) {
    onOpenTool?.(tool, {
      draftText: lastUserDraftRef.current || undefined,
      scroll,
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setError(null);
    setSuggested([]);
    setBusy(true);

    lastUserDraftRef.current = text;
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
          messages: nextMsgs.map((m) => ({
            role: m.role,
            content: m.content === WELCOME_TOKEN ? t("concierge.welcome") : m.content,
          })),
        }),
      });
      const json = (await res.json()) as Partial<ApiResponse> & { error?: string };
      if (!res.ok) {
        throw new Error(json?.error || t("concierge.errors.chatFailed"));
      }
      if (!json.reply) {
        throw new Error(t("concierge.errors.noReply"));
      }

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
      if (suggestedTools.length > 0 && onOpenTool) {
        openSuggestedTool(suggestedTools[0], false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("concierge.errors.chatFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn("w-full min-w-0 max-w-full overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </span>
          <IsendaiLogo
            withWordmark
            className="min-w-0 max-w-full gap-1.5 sm:gap-2"
            iconClassName="size-6 shrink-0 sm:size-7"
            wordmarkClassName="truncate text-sm sm:text-base"
          />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid min-w-0 gap-3">
        <div
          className={cn(
            "max-h-56 min-w-0 space-y-2 overflow-y-auto overflow-x-hidden rounded-xl p-3 text-sm text-slate-200",
            sectionPanelViolet,
            "border-violet-400/25 from-violet-500/10 to-violet-950/20 shadow-inner"
          )}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-full break-words rounded-lg border px-3 py-2",
                m.role === "user"
                  ? "ml-auto w-[min(92%,100%)] border-primary/30 bg-primary/10"
                  : "mr-auto w-[min(92%,100%)] border-border/60 bg-card"
              )}
            >
              <p className="whitespace-pre-wrap break-words">
                {m.role === "assistant"
                  ? renderMarkdownLinks(
                      m.content === WELCOME_TOKEN ? t("concierge.welcome") : m.content,
                      onOpenTool ? (tool) => openSuggestedTool(tool, true) : undefined
                    )
                  : m.content}
              </p>
            </div>
          ))}
          {busy ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <Loader2 className="size-3 animate-spin text-indigo-400" />
              {t("concierge.thinking")}
            </div>
          ) : null}
        </div>

        {error ? (
          <div
            className="rounded-lg border border-rose-400/35 bg-rose-950/55 p-3 text-sm leading-relaxed text-rose-100 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {suggested.length ? (
          <div className="flex min-w-0 flex-wrap gap-2">
            {suggested.map((tool) => (
              <Button
                key={tool}
                type="button"
                variant="outline"
                size="sm"
                className="max-w-full shrink"
                onClick={() => openSuggestedTool(tool, true)}
              >
                <span className="mr-1 shrink-0" aria-hidden="true">
                  {getToolDefinition(tool).emoji}
                </span>
                <span className="truncate">{toolTitle(t, tool, getToolDefinition(tool).title)}</span>
                <ArrowRight className="size-4 shrink-0 text-indigo-400" />
              </Button>
            ))}
          </div>
        ) : null}

        <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
          <Input
            className="min-w-0 flex-1"
            value={input}
            maxLength={TOOL_INPUT_MAX_CHARS}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("concierge.placeholder")}
            onKeyDown={(e) => {
              if (e.key === "Enter") void send();
            }}
            disabled={busy}
          />
          <Button
            type="button"
            className="w-full shrink-0 sm:w-auto"
            onClick={send}
            disabled={busy || !input.trim()}
          >
            <SendHorizonal className="size-4 text-white" />
            <span className="sm:sr-only">{t("concierge.send")}</span>
            <span className="hidden sm:inline">{t("concierge.send")}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
