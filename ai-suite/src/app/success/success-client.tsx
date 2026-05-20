"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AiFeedbackBar } from "@/components/ai-feedback-bar";
import { AiResultShareBar } from "@/components/ai-result-share-bar";
import { originalTextFromPayload } from "@/lib/feedback/original-text-from-payload";

import type { ToolName, ToolPayload } from "@/components/ai-suite/tools";
import { getToolDefinition } from "@/components/ai-suite/tools";
import { useI18n } from "@/i18n/i18n-provider";
import { toolTitle } from "@/i18n/tool-i18n";
import {
  resolveConcreteModelId,
  normalizeUserModelId,
  type ModelId,
  DEFAULT_MODEL,
} from "@/models/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SitePageChrome, SitePageHeader, SitePageMain } from "@/components/site-page-layout";
import { cn } from "@/lib/utils";
import { TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
import { pageContentSection, pageSubtitle, glassSurface } from "@/lib/premium-ui";
import type { ServerAuthSnapshot } from "@/lib/auth/server-auth-snapshot";

type Stored = { v: 1; savedAt: string; payload: ToolPayload };
type Version = { v: 1; id: string; createdAt: string; text: string };
type RequestRef = { v: 1; requestId: string };

function isToolName(value: string | null): value is ToolName {
  return typeof value === "string" && value.length > 0;
}

function resultsKey(toolName: ToolName) {
  return `ai-suite:results:${toolName}`;
}

function pendingAltKey(toolName: ToolName) {
  return `ai-suite:pending-alt:${toolName}`;
}

function requestKey(toolName: ToolName) {
  return `ai-suite:request:${toolName}`;
}

function safeLoadRequest(toolName: ToolName): RequestRef | null {
  try {
    const raw = sessionStorage.getItem(requestKey(toolName));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RequestRef>;
    if (parsed.v !== 1 || typeof parsed.requestId !== "string" || parsed.requestId.length < 10) return null;
    return { v: 1, requestId: parsed.requestId };
  } catch {
    return null;
  }
}

function persistRequest(toolName: ToolName, requestId: string) {
  try {
    sessionStorage.setItem(requestKey(toolName), JSON.stringify({ v: 1, requestId }));
  } catch {
    // ignore
  }
}

function safeLoadVersions(toolName: ToolName): Version[] {
  try {
    const raw = sessionStorage.getItem(resultsKey(toolName));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cleaned: Version[] = parsed
      .filter((x) => typeof x === "object" && x !== null)
      .map((x) => x as Partial<Version>)
      .filter(
        (x) =>
          x.v === 1 &&
          typeof x.id === "string" &&
          typeof x.createdAt === "string" &&
          typeof x.text === "string"
      )
      .map((x) => ({ v: 1, id: x.id!, createdAt: x.createdAt!, text: x.text! }));
    return cleaned.slice(0, 5);
  } catch {
    return [];
  }
}

function persistVersions(toolName: ToolName, next: Version[]) {
  try {
    sessionStorage.setItem(resultsKey(toolName), JSON.stringify(next.slice(0, 5)));
  } catch {
    // ignore
  }
}

function hasPendingAlt(toolName: ToolName) {
  try {
    return sessionStorage.getItem(pendingAltKey(toolName)) === "1";
  } catch {
    return false;
  }
}

function setPendingAlt(toolName: ToolName, value: boolean) {
  try {
    if (value) sessionStorage.setItem(pendingAltKey(toolName), "1");
    else sessionStorage.removeItem(pendingAltKey(toolName));
  } catch {
    // ignore
  }
}

function modelUsedLabel(_toolName: ToolName, model: ModelId): string {
  return resolveConcreteModelId(model);
}

function isValidPayload(payload: ToolPayload): boolean {
  if (payload.tool === "coverletter-ai") {
    return (
      "jobLink" in payload &&
      "resume" in payload &&
      typeof payload.jobLink === "string" &&
      typeof payload.resume === "string" &&
      payload.jobLink.trim().length >= 8 &&
      payload.resume.trim().length >= 20
    );
  }
  if (payload.tool === "dating-roast") {
    const text = "text" in payload ? payload.text : payload.profile;
    return typeof text === "string" && text.trim().length >= 10;
  }
  return "text" in payload && typeof payload.text === "string" && payload.text.trim().length >= 10;
}

export function SuccessClient({
  authSnapshot = null,
}: {
  authSnapshot?: ServerAuthSnapshot | null;
}) {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");
  const isTest = searchParams.get("test") === "1";
  const isPaidReturn = searchParams.get("paid") === "1";
  const { t } = useI18n();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [insufficientCredits, setInsufficientCredits] = React.useState(false);
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [altExtra, setAltExtra] = React.useState("");
  const [stored, setStored] = React.useState<Stored | null>(null);
  const [lastModelUsed, setLastModelUsed] = React.useState<string>("");
  const storageKeyRef = React.useRef<string | null>(null);
  const active = React.useMemo(() => {
    if (!versions.length) return null;
    if (activeId) {
      const found = versions.find((v) => v.id === activeId);
      if (found) return found;
    }
    return versions[versions.length - 1] ?? null;
  }, [activeId, versions]);
  const activeIndex = React.useMemo(() => {
    if (!active) return -1;
    return versions.findIndex((v) => v.id === active.id);
  }, [active, versions]);

  const userQuestion = React.useMemo(() => {
    if (!stored?.payload) return "";
    return originalTextFromPayload(stored.payload);
  }, [stored]);

  const tool: ToolName | null = isToolName(toolParam) ? toolParam : null;

  const cleanup = React.useCallback(() => {
    const storageKey = storageKeyRef.current;
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
      localStorage.removeItem(`${storageKey}:model`);
    } catch {
      // ignore
    }
  }, []);

  const generate = React.useCallback(
    async (toolName: ToolName, parsed: Stored, model: ModelId, extra?: string) => {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...parsed.payload,
          model,
          extra,
        }),
      });
      const raw = await res.text();
      let json: { result?: string; request_id?: string; error?: string; code?: string } | null = null;
      try {
        json = JSON.parse(raw) as { result?: string; error?: string; code?: string };
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (res.status >= 500 && res.status <= 599) {
          toast.error(json?.error ?? t("errors.serverToast"));
        }
        if (res.status === 429 || json?.code === "rate_limited") {
          throw new Error(`RATELIMIT:${json?.error || ""}`);
        }
        if (res.status === 402 || json?.code === "insufficient_credits") {
          throw new Error(`INSUFFICIENT:${json?.error || ""}`);
        }
        throw new Error(json?.error || t("errors.generationFailed"));
      }

      if (!json?.result) throw new Error(t("errors.noModelResult"));
      if (json.request_id && toolName) persistRequest(toolName, json.request_id);
      setLastModelUsed(modelUsedLabel(toolName, model));
      return json.result;
    },
    [setLastModelUsed, t]
  );

  async function generateAltFromRequest(toolName: ToolName, requestId: string, extra?: string) {
    const res = await fetch("/api/isendai/request/version", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ request_id: requestId, extra }),
    });
    const raw = await res.text();
    type VersionApiJson = {
      ok?: boolean;
      text?: string;
      idx?: number;
      error?: string;
      code?: string;
    };
    let json: VersionApiJson | null = null;
    try {
      json = JSON.parse(raw) as VersionApiJson;
    } catch {
      json = null;
    }
    if (!res.ok) {
      if (res.status >= 500 && res.status <= 599) {
        toast.error(json?.error ?? t("errors.serverToast"));
      }
      if (res.status === 429 || json?.code === "rate_limited") {
        throw new Error(`RATELIMIT:${json?.error || ""}`);
      }
      if (res.status === 402 || json?.code === "insufficient_credits") {
        throw new Error(`INSUFFICIENT:${json?.error || ""}`);
      }
      throw new Error(json?.error || t("errors.generationFailed"));
    }
    if (!json?.text) throw new Error(t("errors.noModelResult"));
    const storageKey = getToolDefinition(toolName).storageKey;
    const modelRaw = localStorage.getItem(`${storageKey}:model`);
    const model: ModelId = modelRaw ? normalizeUserModelId(modelRaw) : DEFAULT_MODEL;
    setLastModelUsed(modelUsedLabel(toolName, model));
    return json.text;
  }

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setInsufficientCredits(false);

      if (!tool) {
        setError(t("errors.toolParamMissing"));
        return;
      }

      const storageKey = getToolDefinition(tool).storageKey;
      storageKeyRef.current = storageKey;
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setError(t("errors.noSavedInput"));
        return;
      }

      let parsed: Stored | null = null;
      try {
        parsed = JSON.parse(raw) as Stored;
      } catch {
        setError(t("errors.savedInputParse"));
        return;
      }

      if (!parsed?.payload || parsed.payload.tool !== tool) {
        setError(t("errors.savedInputMismatch"));
        return;
      }
      if (!isValidPayload(parsed.payload)) {
        setError(t("errors.savedInputInvalid"));
        return;
      }

      // Keep payload in memory for alternatives, then clear localStorage later.
      setStored(parsed);

      const modelRaw = localStorage.getItem(`${storageKey}:model`);
      const modelForLabel: ModelId = modelRaw ? normalizeUserModelId(modelRaw) : DEFAULT_MODEL;
      setLastModelUsed(modelUsedLabel(tool, modelForLabel));

      const restored = safeLoadVersions(tool);
      setVersions(restored);
      setActiveId(restored[restored.length - 1]?.id ?? null);

      setLoading(true);
      try {
        const modelRaw = localStorage.getItem(`${storageKey}:model`);
        const model: ModelId = modelRaw ? normalizeUserModelId(modelRaw) : DEFAULT_MODEL;
        if (cancelled) return;

        // Only auto-generate when:
        // - no results yet (first arrival), OR
        // - user completed payment for an alternative (pending flag).
        const restoredNow = safeLoadVersions(tool);
        const shouldGenerate = restoredNow.length === 0 || hasPendingAlt(tool);
        if (!shouldGenerate) return;
        if (restoredNow.length >= 5) {
          setPendingAlt(tool, false);
          return;
        }

        const text = await generate(tool, parsed, model);
        if (cancelled) return;

        const newVersion: Version = {
          v: 1,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          text,
        };
        const next: Version[] = [...restoredNow, newVersion].slice(0, 5);
        setVersions(next);
        setActiveId(newVersion.id);
        persistVersions(tool, next);
        setPendingAlt(tool, false);

        // Privacy: once we have a result, remove saved input from localStorage.
        cleanup();
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : t("errors.generationFailed");
        if (msg.startsWith("RATELIMIT:")) {
          setInsufficientCredits(false);
          const detail = msg.slice("RATELIMIT:".length).trim();
          setError(detail.length > 0 ? detail : t("errors.rateLimit"));
        } else if (msg.startsWith("INSUFFICIENT:")) {
          setInsufficientCredits(true);
          const detail = msg.slice("INSUFFICIENT:".length).trim();
          setError(detail.length > 0 ? detail : t("success.insufficientFallback"));
        } else {
          setInsufficientCredits(false);
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [tool, t, cleanup, generate]);

  React.useEffect(() => {
    if (!active) return;
    const onBeforeUnload = () => cleanup();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active, cleanup]);

  function canGenerateAnother() {
    return tool && versions.length < 5 && !loading;
  }

  async function payAndGenerateAlternative() {
    if (!tool) return;
    if (versions.length >= 5) return;

    const storageKey = getToolDefinition(tool).storageKey;
    storageKeyRef.current = storageKey;
    const modelRaw = localStorage.getItem(`${storageKey}:model`);
    const model: ModelId = modelRaw ? normalizeUserModelId(modelRaw) : DEFAULT_MODEL;

    setPendingAlt(tool, false);
    setLoading(true);
    setError(null);
    setInsufficientCredits(false);
    try {
      const parsed = stored;
      if (!parsed) throw new Error(t("errors.noSavedInput"));
      if (!parsed?.payload || parsed.payload.tool !== tool) throw new Error(t("errors.savedInputMismatch"));
      if (!isValidPayload(parsed.payload)) throw new Error(t("errors.savedInputInvalid"));

      const reqRef = safeLoadRequest(tool);
      const text = reqRef
        ? await generateAltFromRequest(tool, reqRef.requestId, altExtra)
        : await generate(tool, parsed, model, altExtra);
      const newVersion: Version = {
        v: 1,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        text,
      };
      const next: Version[] = [...versions, newVersion].slice(0, 5);
      setVersions(next);
      setActiveId(newVersion.id);
      persistVersions(tool, next);
      cleanup();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("errors.generationFailed");
      if (msg.startsWith("RATELIMIT:")) {
        setInsufficientCredits(false);
        const detail = msg.slice("RATELIMIT:".length).trim();
        setError(detail.length > 0 ? detail : t("errors.rateLimit"));
      } else if (msg.startsWith("INSUFFICIENT:")) {
        setInsufficientCredits(true);
        const detail = msg.slice("INSUFFICIENT:".length).trim();
        setError(detail.length > 0 ? detail : t("success.insufficientFallback"));
      } else {
        setInsufficientCredits(false);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <SitePageChrome>
      <SitePageHeader
        initialSignedInLabel={authSnapshot?.signedIn ? authSnapshot.label : null}
      />
      <SitePageMain width="narrow">
        <div className={cn("mb-4", pageContentSection, "p-4 sm:p-5")}>
          <p className="font-semibold text-white sm:text-lg">{t("success.ephemeral.title")}</p>
          <p className={cn("mt-1", pageSubtitle)}>{t("success.ephemeral.body")}</p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/45" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.65)]" />
          </span>
          <CheckCircle2 className="size-5 text-emerald-400" strokeWidth={1.5} />
          <p className={pageSubtitle}>
            {isTest ? t("success.test") : isPaidReturn ? t("success.paid") : t("success.introCredits")}
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>
                {tool ? (
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{getToolDefinition(tool).emoji}</span>
                    <span>{toolTitle(t, tool, getToolDefinition(tool).title)}</span>
                  </span>
                ) : (
                  t("success.pageFallbackTitle")
                )}
              </CardTitle>
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  {t("nav.backToHome")}
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 className="size-4 animate-spin text-indigo-400" strokeWidth={1.5} />
                {t("success.generating")}
              </div>
            ) : error ? (
              <div className="grid gap-3">
                <div className="rounded-lg border border-rose-400/35 bg-rose-950/55 p-4 text-sm leading-relaxed text-rose-100 shadow-[inset_0_1px_0_0_rgb(255_255_255/0.06)]">
                  {error}
                </div>
                {insufficientCredits ? (
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/10 p-4 text-sm text-slate-200">
                    <p className="font-medium text-white">{t("success.insufficientTitle")}</p>
                    <p className="mt-1 text-slate-300">{t("success.insufficientBody")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href="/pricing">{t("nav.pricing")}</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/login">{t("nav.login")}</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/account">{t("nav.account")}</Link>
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            ) : active ? (
              <>
                <p className="text-xs text-slate-300">
                  {t("success.selectedVersion")}{" "}
                  <span className="font-medium text-foreground">
                    {activeIndex >= 0 ? activeIndex + 1 : 1}/{versions.length}
                  </span>
                </p>
                {userQuestion ? (
                  <div
                    className={cn(
                      "rounded-xl border border-white/[0.08] bg-black/25 p-4 backdrop-blur-md",
                      glassSurface
                    )}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {t("success.yourQuestion")}
                    </p>
                    <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                      {userQuestion}
                    </p>
                  </div>
                ) : null}
                <div className={cn("overflow-hidden rounded-xl", glassSurface)}>
                  <AiResultShareBar text={active.text} onCopied={cleanup} />
                  <div
                    className={cn(
                      "min-h-[8rem] whitespace-pre-wrap p-4 text-sm leading-relaxed text-slate-300",
                      "selection:bg-primary/20"
                    )}
                  >
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {t("success.aiAnswer")}
                    </p>
                    {active.text}
                  </div>
                </div>
                {tool && stored?.payload ? (
                  <AiFeedbackBar
                    key={active.id}
                    feedbackKey={active.id}
                    toolId={tool}
                    originalText={originalTextFromPayload(stored.payload)}
                    aiResponse={active.text}
                    modelUsed={lastModelUsed || "unknown"}
                    requestId={safeLoadRequest(tool)?.requestId ?? null}
                  />
                ) : null}
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-slate-300">
                    {t("success.alt.extra.label")}
                  </p>
                  <Textarea
                    value={altExtra}
                    maxLength={TOOL_INPUT_MAX_CHARS}
                    onChange={(e) => setAltExtra(e.target.value)}
                    placeholder={t("success.alt.extra.placeholder")}
                    className="min-h-20"
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-slate-300">
                    {t("success.versions")} {versions.length}
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={payAndGenerateAlternative}
                      disabled={!canGenerateAnother()}
                    >
                      {t("success.alt.generate")}
                    </Button>
                  </div>
                </div>

                {versions.length > 1 ? (
                  <div className="grid gap-2">
                    {versions
                      .slice()
                      .reverse()
                      .map((v, idx) => (
                        <button
                          key={v.id}
                          type="button"
                          className={cn(
                            "rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 text-left text-sm text-slate-300 shadow-inner backdrop-blur-xl transition-all duration-300",
                            "hover:border-violet-500/35 hover:bg-white/[0.06]",
                            v.id === active.id
                              ? "border-violet-500/45 bg-violet-500/10 shadow-[0_0_16px_rgba(139,92,246,0.12)]"
                              : ""
                          )}
                          onClick={() => {
                            setActiveId(v.id);
                          }}
                        >
                          <div className="mb-1 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={v.id === active.id}
                              readOnly
                              className="size-4 accent-[hsl(var(--primary))]"
                              aria-label={t("success.selectedVersion")}
                            />
                            <p className="text-xs font-semibold text-slate-300">
                              {t("success.alt.version")} {versions.length - idx}
                            </p>
                          </div>
                          <p className="line-clamp-3 whitespace-pre-wrap">{v.text}</p>
                        </button>
                      ))}
                  </div>
                ) : null}

                {tool && versions.length >= 5 ? (
                  <div className={cn("rounded-lg p-3 text-sm text-slate-400", glassSurface)}>
                    {t("success.alt.limit")}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-300">{t("success.ready")}</p>
            )}
          </CardContent>
        </Card>
      </SitePageMain>
    </SitePageChrome>
  );
}

