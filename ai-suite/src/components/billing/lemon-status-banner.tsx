import { getLemonMerchantStatus } from "@/lib/billing/lemon-merchant-status";
import { cn } from "@/lib/utils";

const STYLES: Record<
  ReturnType<typeof getLemonMerchantStatus>,
  string
> = {
  pending_review:
    "border-amber-400/35 bg-amber-950/40 text-amber-50",
  test: "border-sky-400/30 bg-sky-950/35 text-sky-50",
  unconfigured: "border-rose-400/30 bg-rose-950/35 text-rose-50",
  live: "border-emerald-400/30 bg-emerald-950/30 text-emerald-50",
};

/** Server banner: set NEXT_PUBLIC_LEMON_MERCHANT_STATUS=pending_review while Lemon reviews your store. */
export function LemonStatusBanner({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  const status = getLemonMerchantStatus();
  if (status === "live") return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-xl border px-4 py-3 text-sm leading-relaxed",
        STYLES[status],
        className
      )}
    >
      {message}
    </div>
  );
}
