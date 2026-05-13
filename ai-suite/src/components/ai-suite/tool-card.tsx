"use client";

import * as React from "react";
import { Briefcase, Flame, Mail } from "lucide-react";
import { toast } from "sonner";

import type { ToolName, ToolPayload } from "./tools";
import { getToolDefinition } from "./tools";
import {
  defaultConcreteModelForProvider,
  creditsForGeneration,
  isModelId,
  modelSalesTier,
  normalizeModelIdString,
  tierTenPackSummary,
  type ConcreteModelId,
  type ModelId,
} from "@/models/models";
import { ModelSwitcher } from "@/components/model-switcher";
import { openPricingModal } from "@/components/pricing/pricing-modal";
import { TOOL_INPUT_MAX_CHARS } from "@/lib/constants/input-limits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toolDescription, toolPrimaryActionLabel, toolTitle } from "@/i18n/tool-i18n";
import { useI18n } from "@/i18n/i18n-provider";
import { FreeTrialEmailDialog } from "@/components/marketing/free-trial-email-dialog";
import {
  readFreeTrialUsed,
  saveLeadEmail,
  setFreeTrialUsed,
} from "@/lib/marketing/storage-keys";

function ToolIcon({ tool, className }: { tool: ToolName; className?: string }) {
  const Icon = tool === "corporate-whisperer" ? Mail : tool === "coverletter-ai" ? Briefcase : Flame;
  return <Icon className={cn("size-5 text-indigo-400", className)} strokeWidth={1.5} />;
}

function savePayload(storageKey: string, payload: ToolPayload) {
  localStorage.setItem(
    storageKey,
    JSON.stringify({ v: 1, savedAt: new Date().toISOString(), payload })
  );
}

function saveModel(storageKey: string, model: string) {
  localStorage.setItem(storageKey, model);
}

function primeSuccessSession(tool: ToolName, text: string, requestId: string) {
  const version = {
    v: 1 as const,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    text,
  };
  sessionStorage.setItem(`ai-suite:results:${tool}`, JSON.stringify([version]));
  sessionStorage.setItem(`ai-suite:request:${tool}`, JSON.stringify({ v: 1, requestId }));
}

export function ToolCard({
  tool,
  showHeader = true,
  initialText,
  enableMarketingFreeTrial = false,
}: {
  tool: ToolName;
  showHeader?: boolean;
  /** Prefill main text (e.g. from `?text=`). Ignored for coverletter-ai. */
  initialText?: string;
  /** When true (e.g. `/tool/[id]`), first generation can be gated behind email lead capture. */
  enableMarketingFreeTrial?: boolean;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [trialUsed, setTrialUsed] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
      setTrialUsed(readFreeTrialUsed());
    });
  }, []);

  const def = getToolDefinition(tool);
  const modelStorageKey = `${def.storageKey}:model`;
  const [model, setModel] = React.useState<ModelId>("auto");

  React.useEffect(() => {
    queueMicrotask(() => {
      try {
        const raw = localStorage.getItem(modelStorageKey);
        const normalized = raw ? normalizeModelIdString(raw) : "";
        setModel(isModelId(normalized) ? normalized : "auto");
      } catch {
        setModel("auto");
      }
    });
  }, [modelStorageKey]);

  function persistModel(next: ModelId) {
    setModel(next);
    try {
      localStorage.setItem(modelStorageKey, next);
    } catch {
      // ignore
    }
  }

  const concreteModel: ConcreteModelId =
    model === "auto" ? defaultConcreteModelForProvider(def.provider) : (model as ConcreteModelId);

  function localizedPlaceholder(key: string, fallback: string) {
    const resolved = t(key);
    return resolved === key ? fallback : resolved;
  }

  const trimmedInitial = initialText?.trim() ?? "";
  const [text, setText] = React.useState(() =>
    tool !== "coverletter-ai" && trimmedInitial.length > 0 ? trimmedInitial : ""
  );
  const [jobLink, setJobLink] = React.useState("");
  const [resume, setResume] = React.useState("");

  const payload: ToolPayload =
    tool === "coverletter-ai"
      ? { tool, jobLink, resume }
      : { tool, text };

  const isValid =
    tool === "coverletter-ai"
      ? jobLink.trim().length >= 8 && resume.trim().length >= 20
      : text.trim().length >= 10;

  const priceListLabel = tierTenPackSummary(modelSalesTier(concreteModel));
  const inputCharLen =
    tool === "coverletter-ai"
      ? jobLink.trim().length + resume.trim().length
      : text.trim().length;
  const genCost = creditsForGeneration(concreteModel, Math.max(inputCharLen, 1));
  const costAmount =
    genCost === 1 ? t("tool.billing.creditOne") : t("tool.billing.creditsMany").replace("{n}", String(genCost));
  const paidGenerateLabel = t("tool.billing.paidButton")
    .replace("{action}", toolPrimaryActionLabel(t, tool, def.actionLabel))
    .replace("{amount}", costAmount);
  const showFreeCta = mounted && enableMarketingFreeTrial && !trialUsed;

  async function runPaidGeneration() {
    if (!isValid) {
      toast.error(t("tool.validation.empty"));
      return;
    }
    setBusy(true);
    try {
      savePayload(def.storageKey, payload);
      saveModel(modelStorageKey, model);

      const body: Record<string, unknown> = {
        ...payload,
        ...(model === "auto" ? {} : { model: concreteModel }),
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      type GenJson = {
        result?: string;
        request_id?: string;
        error?: string;
        code?: string;
        credits_required?: number;
        credits_balance?: number;
      };
      let json: GenJson | null = null;
      try {
        json = JSON.parse(rawText) as GenJson;
      } catch {
        json = null;
      }

      if (res.status === 402 || json?.code === "insufficient_credits") {
        openPricingModal(tool);
        toast.error(json?.error ?? t("errors.generationFailed"));
        return;
      }

      if (!res.ok) {
        toast.error(json?.error ?? t("errors.generationFailed"));
        return;
      }

      if (!json?.result || !json.request_id) {
        toast.error(t("errors.noModelResult"));
        return;
      }

      primeSuccessSession(tool, json.result, json.request_id);
      window.location.href = `/success?tool=${encodeURIComponent(tool)}`;
    } finally {
      setBusy(false);
    }
  }

  async function runFreeGeneration(email: string) {
    if (!isValid) {
      toast.error(t("tool.validation.empty"));
      return;
    }
    setBusy(true);
    try {
      savePayload(def.storageKey, payload);
      saveModel(modelStorageKey, model);

      const body: Record<string, unknown> = {
        ...payload,
        ...(model === "auto" ? {} : { model: concreteModel }),
        leadEmail: email,
        marketingFreeTrial: true,
      };

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const rawText = await res.text();
      type GenJson = { result?: string; request_id?: string; error?: string; code?: string };
      let json: GenJson | null = null;
      try {
        json = JSON.parse(rawText) as GenJson;
      } catch {
        json = null;
      }

      if (!res.ok) {
        if (res.status === 402 || json?.code === "insufficient_credits") {
          openPricingModal(tool);
          toast.error(json?.error ?? t("errors.generationFailed"));
          return;
        }
        if (json?.code === "free_trial_used") {
          setFreeTrialUsed(true);
          setTrialUsed(true);
          toast.error(t("growth.freeTrial.deviceAlreadyUsed"));
        } else if (json?.code === "invalid_lead_email") {
          toast.error(t("growth.freeTrial.invalidEmail"));
        } else {
          toast.error(json?.error ?? t("errors.generationFailed"));
        }
        return;
      }

      if (!json?.result || !json.request_id) {
        toast.error(t("errors.noModelResult"));
        return;
      }

      saveLeadEmail(email);
      setFreeTrialUsed(true);
      setTrialUsed(true);
      primeSuccessSession(tool, json.result, json.request_id);
      setDialogOpen(false);
      window.location.href = `/success?tool=${encodeURIComponent(tool)}`;
    } finally {
      setBusy(false);
    }
  }

  async function onPrimaryClick() {
    if (!isValid) {
      toast.error(t("tool.validation.empty"));
      return;
    }
    if (showFreeCta) {
      setDialogOpen(true);
      return;
    }
    await runPaidGeneration();
  }

  return (
    <>
      <Card className="overflow-hidden">
        {showHeader ? (
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="inline-flex size-9 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] backdrop-blur-xl">
                <ToolIcon tool={tool} />
              </div>
              <div className="min-w-0">
                <CardTitle className="truncate">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true">{def.emoji}</span>
                    <span>{toolTitle(t, tool, def.title)}</span>
                  </span>
                </CardTitle>
                <CardDescription className="mt-1">
                  {toolDescription(t, tool, def.description)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        ) : null}

        <CardContent className="flex flex-col gap-4">
          {tool === "coverletter-ai" ? (
            <div className="grid gap-3">
              <Input
                value={jobLink}
                onChange={(e) => setJobLink(e.target.value)}
                placeholder={localizedPlaceholder(
                  "tool.cover.placeholder1",
                  def.fields.find((f) => f.key === "jobLink")?.placeholder ?? ""
                )}
              />
              <Textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                placeholder={localizedPlaceholder(
                  "tool.cover.placeholder2",
                  def.fields.find((f) => f.key === "resume")?.placeholder ?? ""
                )}
              />
            </div>
          ) : (
            <Textarea
              value={text}
              maxLength={TOOL_INPUT_MAX_CHARS}
              onChange={(e) => setText(e.target.value)}
              placeholder={localizedPlaceholder(
                tool === "corporate-whisperer"
                  ? "tool.corp.placeholder"
                  : tool === "dating-roast"
                    ? "tool.dating.placeholder"
                    : `tool.${tool}.placeholder.text`,
                def.fields.find((f) => f.key === "text")?.placeholder ?? ""
              )}
            />
          )}

          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-slate-400">{t("tool.modelSelectLabel")}</p>
            <ModelSwitcher
              tool={tool}
              model={model}
              onModelChange={persistModel}
              className="w-full max-w-md px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="text-sm text-slate-300">{t("tool.flow.hint")}</p>
              <div className="space-y-1 text-xs text-slate-500">
                <p>{t("tool.priceReference").replace("{price}", priceListLabel)}</p>
                <p className="text-[11px] leading-snug text-slate-500">{t("tool.pricePackFlex")}</p>
              </div>
            </div>
            <Button className="shrink-0" onClick={() => void onPrimaryClick()} disabled={busy}>
              {showFreeCta ? t("growth.freeTrial.ctaButton") : paidGenerateLabel}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FreeTrialEmailDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t("growth.freeTrial.modalTitle")}
        description={t("growth.freeTrial.modalBody")}
        placeholder={t("growth.freeTrial.placeholder")}
        submitLabel={t("growth.freeTrial.submit")}
        cancelLabel={t("growth.freeTrial.cancel")}
        onSubmit={runFreeGeneration}
      />
    </>
  );
}
