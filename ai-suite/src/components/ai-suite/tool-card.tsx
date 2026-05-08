"use client";

import * as React from "react";
import { Briefcase, Flame, Mail } from "lucide-react";

import type { ToolName, ToolPayload } from "./tools";
import { getStripeLink, TOOL_META } from "./tools";
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

function savePayload(payload: ToolPayload) {
  const key = TOOL_META[payload.tool].storageKey;
  localStorage.setItem(
    key,
    JSON.stringify({ v: 1, savedAt: new Date().toISOString(), payload })
  );
}

export function ToolCard({ tool }: { tool: ToolName }) {
  const [busy, setBusy] = React.useState(false);
  const { t } = useI18n();

  const [text, setText] = React.useState("");
  const [jobLink, setJobLink] = React.useState("");
  const [resume, setResume] = React.useState("");
  const [profile, setProfile] = React.useState("");

  const meta = TOOL_META[tool];

  const payload: ToolPayload =
    tool === "corporate-whisperer"
      ? { tool, text }
      : tool === "coverletter-ai"
        ? { tool, jobLink, resume }
        : { tool, profile };

  const isValid =
    tool === "corporate-whisperer"
      ? text.trim().length >= 10
      : tool === "coverletter-ai"
        ? jobLink.trim().length >= 8 && resume.trim().length >= 20
        : profile.trim().length >= 10;

  const buttonLabel =
    tool === "corporate-whisperer"
      ? t("tool.corp.button")
      : tool === "coverletter-ai"
        ? t("tool.cover.button")
        : t("tool.dating.button");

  async function onPayAndGenerate() {
    setBusy(true);
    try {
      savePayload(payload);
      const link = getStripeLink(tool);
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
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="inline-flex size-9 items-center justify-center rounded-lg border bg-background">
            <ToolIcon tool={tool} />
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate">{meta.label}</CardTitle>
            <CardDescription className="mt-1">
              {tool === "corporate-whisperer"
                ? t("tool.corp.desc")
                : tool === "coverletter-ai"
                  ? t("tool.cover.desc")
                  : t("tool.dating.desc")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {tool === "corporate-whisperer" ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("tool.corp.placeholder")}
          />
        ) : tool === "coverletter-ai" ? (
          <div className="grid gap-3">
            <Input
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder={t("tool.cover.placeholder1")}
            />
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder={t("tool.cover.placeholder2")}
            />
          </div>
        ) : (
          <Textarea
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder={t("tool.dating.placeholder")}
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

