/**
 * OpenAI o-series / some reasoning endpoints reject `temperature`.
 * Omit the parameter for those models instead of sending a deprecated value.
 */
export function modelSupportsTemperature(modelId: string): boolean {
  const id = modelId.toLowerCase().trim();
  if (!id) return true;
  if (id === "deepseek-reasoner" || id.includes("reasoner")) return false;
  if (/^o\d/.test(id) || id.startsWith("o1") || id.startsWith("o3") || id.startsWith("o4")) {
    return false;
  }
  return true;
}

export function withOptionalTemperature(
  modelId: string,
  temperature: number
): { temperature?: number } {
  return modelSupportsTemperature(modelId) ? { temperature } : {};
}

export function messageLooksLikeTemperatureUnsupported(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("temperature") &&
    (m.includes("deprecated") ||
      m.includes("unsupported") ||
      m.includes("not supported") ||
      m.includes("not allowed") ||
      m.includes("invalid") ||
      m.includes("unknown parameter"))
  );
}
