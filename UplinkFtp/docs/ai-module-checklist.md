# Uplink FTP — AI module checklist

Authoritative scope for the AI layer. Cursor rule: `.cursor/rules/uplink-ftp-ai-module.mdc`.  
**BYOK:** no embedded API keys. Keys → Windows Credential Locker via `ICredentialStore`.

## Status legend

| Status | Meaning |
| --- | --- |
| **Implemented** | Code + tests (or WinUI wired) in repo |
| **Scaffold** | Interfaces / stubs / UI hooks only |
| **Not started** | Spec only |

## Architecture & security

| Item | Status | Notes |
| --- | --- | --- |
| `IAiAssistantService` modular surface | Scaffold | `UplinkFtp.Core/Services/Ai/` |
| BYOK OpenAI / Anthropic provider setting | Scaffold | Settings → AI; no key in repo |
| API key in Credential Locker (`ai.apiKey`) | Scaffold | `AiCredentialKeys` + `ICredentialStore` |
| Never log/send site passwords or license keys to LLM | Implemented (policy) | Enforced in prompts / redaction helpers |
| Local heuristic fallback without key | Implemented | `LocalAiAssistantService` + existing Assist URI/diagnose |

## Capability board

| # | Capability | Status | Entry points |
| --- | --- | --- | --- |
| 1 | **AI Troubleshooter** — log watch, detect 550/530/timeout/SSL, “Solve with AI”, actionable advice | Scaffold | Assist dialog; Message log action (UI pending) |
| 2 | **Natural language search** — NL → filter/LINQ on listings | Scaffold | Interface methods; UI pending |
| 3 | **AI batch processing** — NL batch rename + smart move with preview | Scaffold | Interface methods; UI pending |
| 4 | **SSH command assistant** — NL → shell command, SFTP only, user approve | Scaffold | Interface methods; never auto-run |
| 5 | **AI Quick Edit** — remote config NL edit, preview, confirm upload | Scaffold | Interface methods; UI pending |

## Acceptance per capability

### 1. Troubleshooter
- [ ] Detects common FTP/SFTP/transfer error patterns from Message log  
- [ ] “Solve with AI” / Assist path returns structured steps  
- [ ] With BYOK key: optional cloud enrichment; without key: local heuristics still work  
- [ ] No credential leakage in prompts or logs  

### 2. NL search
- [ ] Sample: “ZIP files larger than 50MB containing backup from last week” → structured filter  
- [ ] Applied to current local or remote listing  
- [ ] Invalid/unsupported queries show clear user message  

### 3. Batch processing
- [ ] Rename preview before apply  
- [ ] Smart move preview before enqueue  
- [ ] User can cancel preview  

### 4. SSH assistant
- [ ] Disabled unless SFTP connected  
- [ ] Shows proposed command; execute only after explicit approve (execution host TBD)  

### 5. Quick Edit
- [ ] Loads remote file bytes/text into memory  
- [ ] Shows proposed diff/new content  
- [ ] Uploads only after confirm  

## Out of scope (for now)

- Shipping vendor API keys or proxying a Cursor-owned LLM  
- Auto-executing SSH commands without confirmation  
- Sending entire remote directory trees to a model by default  

## Related code

| Piece | Path |
| --- | --- |
| Interface + DTOs | `src/UplinkFtp.Core/Services/Ai/` |
| Local fallback | `LocalAiAssistantService` |
| Cloud stub | `CloudAiAssistantService` (requires BYOK) |
| Settings / Assist UI | `SettingsDialog`, `AssistDialog` |
| Credential store | `ICredentialStore` / `WindowsCredentialStore` |
