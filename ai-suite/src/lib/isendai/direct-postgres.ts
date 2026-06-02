import postgres from "postgres";

let directSql: ReturnType<typeof postgres> | null = null;

/** Direct DB access (bypasses PostgREST schema exposure). */
export function getDirectPostgresSql(): ReturnType<typeof postgres> | null {
  const url =
    process.env.SUPABASE_DATABASE_URL?.trim() ||
    process.env.DIRECT_POSTGRES_URL?.trim();
  if (!url) return null;
  if (!directSql) {
    directSql = postgres(url, {
      ssl: "require",
      max: 4,
      idle_timeout: 30,
      connect_timeout: 12,
      prepare: false,
    });
  }
  return directSql;
}
