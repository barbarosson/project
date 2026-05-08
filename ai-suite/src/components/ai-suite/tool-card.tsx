"use client";

import * as React from "react";
import { Briefcase, Flame, Mail } from "lucide-react";

import type { ToolName, ToolPayload } from "./tools";
import { getStripeLink, getToolDefinition } from "./tools";
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

export function ToolCard({
  tool,
  showHeader = true,
}: {
  tool: ToolName;
  showHeader?: boolean;
}) {
  const [busy, setBusy] = React.useState(false);
  const def = getToolDefinition(tool);

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

  const buttonLabel = def.buttonLabel;

  async function onPayAndGenerate() {
    setBusy(true);
    try {
      savePayload(def.storageKey, payload);
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
      {showHeader ? (
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="inline-flex size-9 items-center justify-center rounded-lg border bg-background">
              <ToolIcon tool={tool} />
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate">{def.label}</CardTitle>
              <CardDescription className="mt-1">{def.description}</CardDescription>
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
              placeholder={def.fields.find((f) => f.key === "jobLink")?.placeholder ?? ""}
            />
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder={def.fields.find((f) => f.key === "resume")?.placeholder ?? ""}
            />
          </div>
        ) : (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={def.fields.find((f) => f.key === "text")?.placeholder ?? ""}
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

