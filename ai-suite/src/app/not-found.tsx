import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">
        The page you’re looking for doesn’t exist.
      </p>
      <Button asChild variant="outline">
        <Link href="/">
          <ArrowLeft className="size-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
}

