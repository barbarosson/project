"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, Loader2 } from "lucide-react";

import type { ToolName, ToolPayload } from "@/components/ai-suite/tools";
import { TOOL_META } from "@/components/ai-suite/tools";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Stored = { v: 1; savedAt: string; payload: ToolPayload };

function isToolName(value: string | null): value is ToolName {
  return (
    value === "corporate-whisperer" ||
    value === "coverletter-ai" ||
    value === "dating-roast"
  );
}

export function SuccessClient() {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get("tool");
  const isTest = searchParams.get("test") === "1";

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<string>("");

  const tool: ToolName | null = isToolName(toolParam) ? toolParam : null;

  React.useEffect(() => {
    let cancelled = false;

    async function run() {
      setError(null);
      setResult("");

      if (!tool) {
        setError(
          "Missing or invalid tool parameter. Expected /success?tool=corporate-whisperer|coverletter-ai|dating-roast"
        );
        return;
      }

      const storageKey = TOOL_META[tool].storageKey;
      const raw = localStorage.getItem(storageKey);
      if (!raw) {
        setError(
          "No saved input found in localStorage for this tool. Please go back and try again."
        );
        return;
      }

      let parsed: Stored | null = null;
      try {
        parsed = JSON.parse(raw) as Stored;
      } catch {
        setError(
          "Saved input could not be parsed. Please go back and try again."
        );
        return;
      }

      if (!parsed?.payload || parsed.payload.tool !== tool) {
        setError(
          "Saved input does not match the requested tool. Please go back and try again."
        );
        return;
      }

      setLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(parsed.payload),
        });
        const json = (await res.json()) as { result?: string; error?: string };

        if (!res.ok) throw new Error(json?.error || "Generation failed.");
        if (!json.result) throw new Error("No result returned.");
        if (cancelled) return;
        setResult(json.result);
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
  }, [tool]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(result);
    } catch {
      // ignore
    }
  }

  return (
    <div className="min-h-full bg-background">
      <main className="mx-auto w-full max-w-3xl px-4 py-12">
        <div className="mb-6 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-500" />
          <p className="text-sm text-muted-foreground">
            {isTest
              ? "Test mode. Generating your result…"
              : "Payment received. Generating your result…"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{tool ? TOOL_META[tool].label : "Success"}</CardTitle>
            <CardDescription>
              {tool ? "We’re using your saved input from localStorage." : "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Generating with GPT‑4o‑mini…
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                {error}
              </div>
            ) : result ? (
              <>
                <div
                  className={cn(
                    "whitespace-pre-wrap rounded-xl border bg-card p-4 text-sm leading-relaxed",
                    "selection:bg-primary/20"
                  )}
                >
                  {result}
                </div>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={copy}>
                    <Copy className="size-4" />
                    Copy to Clipboard
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Ready when you are.</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

