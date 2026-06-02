import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline | isendai",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-violet-300">Offline</p>
      <h1 className="font-display text-2xl font-bold text-white">No connection</h1>
      <p className="text-sm leading-relaxed text-slate-300">
        isendai needs the internet to generate messages. Reconnect and try again.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-semibold text-white"
      >
        Back to home
      </Link>
    </main>
  );
}
