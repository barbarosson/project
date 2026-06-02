# AI model catalog

## Add a model (code)

1. Add one entry to `src/models/models-catalog-base.ts` (id, label, provider, pricing).
2. If it changes a flagship tier, update `config/model-catalog.json` → `tierModels`.
3. Set sales band in `salesPriceForModel()` in `src/models/models.ts` (budget / standard / premium).
4. Bump `LATEST_MODEL_ANNOUNCEMENT.version` in `src/models/model-announcement.ts` when shipping a flagship.

## Deploy-time overrides (no code)

| File / env | Purpose |
|------------|---------|
| `config/model-catalog.json` | Tier flagships, category→provider routing, legacy aliases, provider defaults |
| `config/recommended-models.json` | Extra models merged into the catalog at build time |
| `ISENDAI_MODEL_CATALOG_JSON` | Same shape as `model-catalog.json` (merged on server) |
| `ISENDAI_EXTRA_MODELS_JSON` | `{ "models": [{ "id", "label", "provider", "pricing?" }] }` |

## Routing

- **Auto**: category default provider + `providerDefaults` model (see `config/model-catalog.json`).
- **Tier** (`fast-ai` / `pro-ai` / `genius-ai`): flagship from `tierModels`.
- **Concrete id**: exact API model from the picker.

Category defaults live in `src/lib/ai/category-provider.ts`; overrides in `model-catalog.json` → `categoryProviders`.

## UI

`ModelSwitcher` lists quick tiers + every catalog model by provider.
