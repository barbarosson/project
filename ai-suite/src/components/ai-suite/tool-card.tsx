"use client";

import * as React from "react";
import { Briefcase, Flame, Mail } from "lucide-react";

import type { ToolName, ToolPayload } from "./tools";
import { getStripeLink, TOOL_META } from "./tools";
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
      ? "Translate to Professional - $1.49"
      : tool === "coverletter-ai"
        ? "Generate Cover Letter - $1.49"
        : "Roast & Fix My Profile - $1.49";

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
                ? "Want to yell at your boss or client? Don't. Type your angry, unfiltered thoughts here, and we'll turn it into a polite, HR-friendly masterpiece."
                : tool === "coverletter-ai"
                  ? "Tired of writing the same letter for every job? Paste the job URL and your skills. We'll generate a tailored, ATS-beating cover letter that gets interviews."
                  : "Not getting matches? Our AI will brutally roast your current bio, tell you exactly why it's failing, and write a magnetic new one for you."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {tool === "corporate-whisperer" ? (
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Type what you REALLY want to say... (e.g., "This design is garbage and you clearly didn't read my brief.")`}
          />
        ) : tool === "coverletter-ai" ? (
          <div className="grid gap-3">
            <Input
              value={jobLink}
              onChange={(e) => setJobLink(e.target.value)}
              placeholder="Paste Job Description or URL..."
            />
            <Textarea
              value={resume}
              onChange={(e) => setResume(e.target.value)}
              placeholder="Paste your resume text or key skills..."
            />
          </div>
        ) : (
          <Textarea
            value={profile}
            onChange={(e) => setProfile(e.target.value)}
            placeholder="Paste your current Tinder/Bumble bio or describe your vibe..."
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

