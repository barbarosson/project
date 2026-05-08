"use client";

import * as React from "react";
import { Briefcase, Flame, Mail } from "lucide-react";

import type { ToolName, ToolPayload } from "./tools";
import { getStripeLinkForModel, getToolDefinition } from "./tools";
import { useModel } from "@/models/model-provider";
import { useI18n } from "@/i18n/i18n-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function ToolIcon({ tool, className }: { tool: ToolName; className?: string }) {
  const Icon = tool === "corporate-whisperer" ? Mail : tool === "coverletter-ai" ? Briefcase : Flame;
  return <Icon className={cn("size-5", className)} />;
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

export function ToolCard({
  tool,
  showHeader = true,
}: {
  tool: ToolName;
  showHeader?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const def = getToolDefinition(tool);
  const { model } = useModel();
  const { t } = useI18n();

  const [text, setText] = React.useState("");
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

  const priceLabel =
    model === "gpt-4o-mini" ? "$1.49" : model === "gpt-4.1-mini" ? "$2.49" : "$4.49";
  const buttonLabel = `${t(`tool.${tool}.action`)} - ${priceLabel}`;

  async function onPayAndGenerate() {
    setBusy(true);
    try {
      savePayload(def.storageKey, payload);
      saveModel(`${def.storageKey}:model`, model);
      const link = getStripeLinkForModel(tool, model);
      if (!link) {
        // Stripe not configured yet → allow instant testing via /success
        window.location.href = `/success?tool=${tool}&test=1`;
        return;
      }
      window.location.href = link;
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      {showHeader ? (
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="inline-flex size-9 items-center justify-center rounded-lg border bg-background">
              <ToolIcon tool={tool} />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{t(`tool.${tool}.label`)}</CardTitle>
              <CardDescription className="mt-1">{t(`tool.${tool}.desc`)}</CardDescription>
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
              placeholder={t(`tool.${tool}.placeholder.jobLink`)}
            />
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder={t(`tool.${tool}.placeholder.resume`)}
            />
          </div>
        ) : (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t(`tool.${tool}.placeholder.text`)}
          />
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            After payment, you’ll be redirected back and we’ll generate instantly.
          </p>
          <Button onClick={onPayAndGenerate} disabled={!isValid || busy}>
            {buttonLabel}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

