import type { ToolCategory } from "@/components/ai-suite/tools-data";
import { MODEL_CATALOG_CONFIG } from "@/models/catalog-merge";
import type { ProviderId } from "@/models/models-types";

const DEFAULT_CATEGORY_PROVIDERS: Record<ToolCategory, ProviderId> = {
  "work-career": "openai",
  "freelance-business": "openai",
  "academic-bureaucracy": "openai",
  "crisis-money": "openai",
  "neighbors-living": "deepseek",
  "social-dating": "anthropic",
  "family-deep-personal": "anthropic",
  "creators-media": "groq",
};

export function categoryProviderFor(category: ToolCategory): ProviderId {
  const override = MODEL_CATALOG_CONFIG.categoryProviders?.[category];
  return override ?? DEFAULT_CATEGORY_PROVIDERS[category];
}
