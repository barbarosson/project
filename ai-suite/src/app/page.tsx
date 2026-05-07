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
          <p className="text-sm font-medium text-muted-foreground">AI Suite</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
            Perfect Your Message Before You Hit Send.
          </h1>
          <p className="mt-4 max-w-2xl text-balance text-base text-muted-foreground sm:text-lg">
            Stop overthinking. Let AI transform your angry emails, write your cover letters, and fix your dating profile in seconds.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            No subscription. No sign-ups. Just pay per use.
          </p>
        </section>

        <section className="mt-10">
          <Tabs defaultValue="corporate-whisperer" className="w-full">
            <TabsList className="grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-3">
              <TabsTrigger value="corporate-whisperer" className="h-10 rounded-md border bg-card">
                Corporate Whisperer
              </TabsTrigger>
              <TabsTrigger value="coverletter-ai" className="h-10 rounded-md border bg-card">
                Cover Letter
              </TabsTrigger>
              <TabsTrigger value="dating-roast" className="h-10 rounded-md border bg-card">
                Dating Profile
              </TabsTrigger>
            </TabsList>

            <TabsContent value="corporate-whisperer">
              <div className="grid gap-4 sm:grid-cols-1">
                <ToolCard tool="corporate-whisperer" />
              </div>
            </TabsContent>
            <TabsContent value="coverletter-ai">
              <div className="grid gap-4 sm:grid-cols-1">
                <ToolCard tool="coverletter-ai" />
              </div>
            </TabsContent>
            <TabsContent value="dating-roast">
              <div className="grid gap-4 sm:grid-cols-1">
                <ToolCard tool="dating-roast" />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <ToolCard tool="corporate-whisperer" />
            <ToolCard tool="coverletter-ai" />
            <ToolCard tool="dating-roast" />
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
