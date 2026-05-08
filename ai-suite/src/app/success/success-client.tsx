"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Copy, Loader2 } from "lucide-react";

import type { ToolName, ToolPayload } from "@/components/ai-suite/tools";
import { getStripeLinkForModel, getToolDefinition } from "@/components/ai-suite/tools";
import { useI18n } from "@/i18n/i18n-provider";
import { toolTitle } from "@/i18n/tool-i18n";
import {
  defaultConcreteModelForProvider,
  isModelId,
  type ConcreteModelId,
  type ModelId,
  DEFAULT_MODEL,
} from "@/models/models";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Stored = { v: 1; savedAt: string; payload: ToolPayload };
type Version = { v: 1; id: string; createdAt: string; text: string };

function isToolName(value: string | null): value is ToolName {
  return typeof value === "string" && value.length > 0;
}

function resultsKey(toolName: ToolName) {
  return `ai-suite:results:${toolName}`;
}

function pendingAltKey(toolName: ToolName) {
  return `ai-suite:pending-alt:${toolName}`;
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

export function SuccessClient() {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");
  const isTest = searchParams.get("test") === "1";
  const { t } = useI18n();

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [versions, setVersions] = React.useState<Version[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [altExtra, setAltExtra] = React.useState("");
  const [stored, setStored] = React.useState<Stored | null>(null);
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

  async function generate(toolName: ToolName, parsed: Stored, model: ModelId, extra?: string) {
    const def = getToolDefinition(toolName);
    const concreteModel: ConcreteModelId =
      model === "auto" ? defaultConcreteModelForProvider(def.provider) : (model as ConcreteModelId);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...parsed.payload,
        model: model === "auto" ? undefined : concreteModel,
        extra,
      }),
    });
    const json = (await res.json()) as { result?: string; error?: string };
    if (!res.ok) throw new Error(json?.error || "Generation failed.");
    if (!json.result) throw new Error("No result returned.");
    return json.result;
  }

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);

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

      const restored = safeLoadVersions(tool);
      setVersions(restored);
      setActiveId(restored[restored.length - 1]?.id ?? null);

      setLoading(true);
      try {
        const modelRaw = localStorage.getItem(`${storageKey}:model`);
        const model: ModelId = isModelId(modelRaw) ? modelRaw : DEFAULT_MODEL;
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
        setError(e instanceof Error ? e.message : "Generation failed.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [tool, t, cleanup]);

  React.useEffect(() => {
    if (!active) return;
    const onBeforeUnload = () => cleanup();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [active, cleanup]);

  async function copy() {
    try {
      if (!active) return;
      await navigator.clipboard.writeText(active.text);
      cleanup();
    } catch {
      // ignore
    }
  }

  function canGenerateAnother() {
    return tool && versions.length < 5 && !loading;
  }

  async function payAndGenerateAlternative() {
    if (!tool) return;
    if (versions.length >= 5) return;

    const storageKey = getToolDefinition(tool).storageKey;
    storageKeyRef.current = storageKey;
    const modelRaw = localStorage.getItem(`${storageKey}:model`);
    const model: ModelId = isModelId(modelRaw) ? modelRaw : DEFAULT_MODEL;

    const concreteModel: ConcreteModelId =
      model === "auto" ? defaultConcreteModelForProvider(getToolDefinition(tool).provider) : (model as ConcreteModelId);
    const link = getStripeLinkForModel(tool, concreteModel);
    if (isTest || !link) {
      // Dev/test: generate without redirecting to Stripe.
      setPendingAlt(tool, false);
      setLoading(true);
      setError(null);
      try {
        const parsed = stored;
        if (!parsed) throw new Error(t("errors.noSavedInput"));
        if (!parsed?.payload || parsed.payload.tool !== tool) throw new Error(t("errors.savedInputMismatch"));
        if (!isValidPayload(parsed.payload)) throw new Error(t("errors.savedInputInvalid"));

        const text = await generate(tool, parsed, model, altExtra);
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
        setError(e instanceof Error ? e.message : "Generation failed.");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Persist current results and set a flag, so after Stripe redirects back,
    // we auto-generate one more alternative while keeping previous versions.
    persistVersions(tool, versions);
    setPendingAlt(tool, true);
    window.location.href = link;
  }

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="mb-4 rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300 shadow-sm backdrop-blur-md">
          <p className="font-medium text-white">{t("success.ephemeral.title")}</p>
          <p className="mt-1">{t("success.ephemeral.body")}</p>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <p className="text-sm text-slate-300">
            {isTest
              ? t("success.test")
              : t("success.paid")}
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
                  "Success"
                )}
              </CardTitle>
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeft className="size-4" />
                  {t("nav.backToHome")}
                </Link>
              </Button>
            </div>
            <CardDescription>
              {tool ? t("success.usingSaved") : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
                <div className="flex items-center gap-2 text-sm text-slate-300">
                <Loader2 className="size-4 animate-spin" />
                {t("success.generating")}
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : active ? (
              <>
                <div className="text-xs text-slate-300">
                  {t("success.selectedVersion")}{" "}
                  <span className="font-medium text-foreground">
                    {activeIndex >= 0 ? activeIndex + 1 : 1}/{versions.length}
                  </span>
                </div>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed",
                    "selection:bg-primary/20"
                  )}
                >
                  {active.text}
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-slate-300">
                    {t("success.alt.extra.label")}
                  </p>
                  <Textarea
                    value={altExtra}
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
                    <Button variant="outline" onClick={copy}>
                      <Copy className="size-4" />
                      {t("success.copy")}
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
                            "rounded-lg border bg-background/50 p-3 text-left text-sm transition-colors hover:bg-accent/40",
                            v.id === active.id ? "border-violet-400/30 bg-violet-500/10" : "border-white/10"
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
                  <div className="rounded-lg border border-white/10 bg-slate-900/40 p-3 text-sm text-slate-300 backdrop-blur-md">
                    {t("success.alt.limit")}
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-slate-300">{t("success.ready")}</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

