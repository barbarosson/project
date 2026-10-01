export function BrandMark({
  displayName,
  logoUrl,
  size = "md",
}: {
  displayName: string;
  logoUrl: string | null;
  size?: "sm" | "md";
}) {
  const textClass = size === "sm" ? "text-lg" : "text-xl";
  return (
    <div className="flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className={
            size === "sm" ? "h-8 w-auto max-w-[140px] object-contain" : "h-10 w-auto max-w-[180px] object-contain"
          }
        />
      ) : null}
      <span
        className={`${textClass} font-semibold tracking-tight`}
        style={{ fontFamily: "var(--font-display), Georgia, serif" }}
      >
        {displayName}
      </span>
    </div>
  );
}
