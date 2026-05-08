import { ModeToggle } from "@/components/mode-toggle";
import { ToolCard } from "@/components/ai-suite/tool-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Home() {
  return (
    <div className="min-h-full bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg border bg-card" />
          <span className="text-sm font-semibold tracking-tight">isendai</span>
        </div>
        <ModeToggle />
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="relative overflow-hidden rounded-2xl border bg-card px-6 py-14 shadow-sm sm:px-10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(var(--accent))_0%,transparent_70%)] opacity-60" />
          <p className="text-sm font-medium text-muted-foreground">
            AI Suite for everyday communication
          </p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Perfect Your Message Before You Hit Send.
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Stop overthinking. Let AI transform your angry emails, write your cover letters, and fix your dating profile in seconds.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              No subscription
            </span>
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              No sign-ups
            </span>
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              Pay per use
            </span>
            <span className="rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
              We don’t store your text
            </span>
          </div>
        </section>

        <section className="mt-10 grid gap-10">
          <div>
            <div className="mb-4">
              <h2 className="text-pretty text-xl font-semibold tracking-tight">
                Choose a tool. Paste your text. Get a better version instantly.
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Built for real life: work emails, job applications, and dating bios.
              </p>
            </div>

            <Tabs defaultValue="corporate-whisperer" className="w-full">
              <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
                <TabsTrigger value="corporate-whisperer" className="h-10 rounded-md border bg-card">
                  Corporate
                </TabsTrigger>
                <TabsTrigger value="coverletter-ai" className="h-10 rounded-md border bg-card">
                  Cover Letter
                </TabsTrigger>
                <TabsTrigger value="dating-roast" className="h-10 rounded-md border bg-card">
                  Dating Bio
                </TabsTrigger>
              </TabsList>

              <TabsContent value="corporate-whisperer">
                <ToolCard tool="corporate-whisperer" />
              </TabsContent>
              <TabsContent value="coverletter-ai">
                <ToolCard tool="coverletter-ai" />
              </TabsContent>
              <TabsContent value="dating-roast">
                <ToolCard tool="dating-roast" />
              </TabsContent>
            </Tabs>
          </div>

          <div className="grid gap-4 rounded-2xl border bg-card p-6 sm:grid-cols-3 sm:gap-6 sm:p-8">
            <div>
              <p className="text-sm font-semibold">1) Paste</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Drop your draft, job post, or bio. No formatting needed.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">2) Improve</p>
              <p className="mt-1 text-sm text-muted-foreground">
                AI rewrites with better tone, structure, and clarity.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold">3) Copy & send</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Get a clean result with a one-click copy button.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-pretty text-xl font-semibold tracking-tight">
              The products (quick, punchy, effective)
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Short tools with one job: make you sound better, faster.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">The Corporate Whisperer</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “Say it firmly. Send it safely.”
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">1-Click Cover Letter</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “Tailored, ATS-friendly, interview-ready.”
                </p>
              </div>
              <div className="rounded-xl border bg-card p-4">
                <p className="text-sm font-semibold">Dating Profile Roast & Fix</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  “Less cringe. More matches.”
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">Do you store my text?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                No. Your input is kept in your browser (localStorage) to complete the flow.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">How does payment work?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pay per use. Secure checkout via Stripe. No subscription traps.
              </p>
            </div>
            <div className="rounded-xl border bg-card p-4">
              <p className="text-sm font-semibold">What do I get?</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A polished output you can copy immediately—email, cover letter, or bio.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © 2026 isendai.com. Crafted for better communication.
          </p>
          <p className="text-sm text-muted-foreground">
            🔒 Secure Payments via Stripe | ⚡ Powered by AI | 🚫 We do not store your data.
          </p>
        </div>
      </footer>
    </div>
  );
}
