"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // next-themes: resolvedTheme is undefined on server / first paint — must not branch on it before mount
  const effective = (resolvedTheme ?? "dark") as "dark" | "light";
  const isDark = effective === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {!mounted ? (
        <span className="block size-4 shrink-0" aria-hidden />
      ) : isDark ? (
        <Moon className="size-4 shrink-0" />
      ) : (
        <Sun className="size-4 shrink-0" />
      )}
    </Button>
  );
}

