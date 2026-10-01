import { Prisma } from "@prisma/client";

/** True when Postgres is missing tables/columns Prisma expects (schema not pushed). */
export function isPrismaSchemaDriftError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: table does not exist; P2022: column does not exist
    if (err.code === "P2021" || err.code === "P2022") return true;
  }
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /does not exist in the current database/i.test(msg) ||
    /column .* does not exist/i.test(msg) ||
    /relation .* does not exist/i.test(msg)
  );
}

export function schemaDriftHint(): string {
  return (
    "Database schema out of date — from visitor-analytics run: " +
    "npm run db:validate-push (or npx prisma db push with DATABASE_URL + DIRECT_URL on Supabase)"
  );
}
