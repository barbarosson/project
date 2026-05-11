export function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim().length === 0) {
    throw new Error(`Missing ${name}.`);
  }
  return v;
}

