import Link from "next/link";

import { LoginClient } from "./ui";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-14">
      <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-sm backdrop-blur-md">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-slate-300">
          Get an access link by email. No password.
        </p>
        <div className="mt-5">
          <LoginClient />
        </div>
        <p className="mt-5 text-xs text-slate-400">
          By continuing, you agree to our{" "}
          <Link className="text-violet-300 hover:text-violet-200" href="/terms">
            Terms
          </Link>{" "}
          and{" "}
          <Link className="text-violet-300 hover:text-violet-200" href="/privacy">
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </main>
  );
}

