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
| `IAiAssistantService` modular surface | Implemented | `UplinkFtp.Core/Services/Ai/` |
| BYOK OpenAI / Anthropic provider setting | Implemented | Settings → AI; no key in repo |
| API key in Credential Locker (`ai.apiKey`) | Implemented | `AiCredentialKeys` + `ICredentialStore` |
| Never log/send site passwords or license keys to LLM | Implemented (policy) | Enforced in prompts / redaction helpers |
| Local heuristic fallback without key | Implemented | `LocalAiAssistantService` + Assist URI/diagnose |

## Capability board

| # | Capability | Status | Entry points |
| --- | --- | --- | --- |
| 1 | **AI Troubleshooter** — log watch, detect 550/530/timeout/SSL, “Solve with AI”, actionable advice | Implemented | Message log **Solve with AI**; Assist → Troubleshoot |
| 2 | **Natural language search** — NL → filter/LINQ on listings | Implemented | Local/Remote **Filter** row; Assist → Search |
| 3 | **AI batch processing** — NL batch rename + smart move with preview | Implemented | Assist → Batch (preview → apply via `RenameAsync`) |
| 4 | **SSH command assistant** — NL → shell command, SFTP only, user approve | Implemented | Assist → SSH (`ExecuteShellCommandAsync` after approve) |
| 5 | **AI Quick Edit** — remote config NL edit, preview, confirm upload | Implemented | Remote context menu / **AI Quick Edit**; Assist → Quick Edit |

## Acceptance per capability

### 1. Troubleshooter
- [x] Detects common FTP/SFTP/transfer error patterns from Message log  
- [x] “Solve with AI” / Assist path returns structured steps  
- [x] With BYOK key: optional cloud enrichment; without key: local heuristics still work  
- [x] No credential leakage in prompts or logs  

### 2. NL search
- [x] Sample: “ZIP files larger than 50MB containing backup from last week” → structured filter  
- [x] Applied to current local or remote listing  
- [x] Invalid/unsupported queries show clear user message  

### 3. Batch processing
- [x] Rename preview before apply  
- [x] Smart move preview before enqueue  
- [x] User can cancel preview  

### 4. SSH assistant
- [x] Disabled unless SFTP connected  
- [x] Shows proposed command; execute only after explicit approve  

### 5. Quick Edit
- [x] Loads remote file bytes/text into memory  
- [x] Shows proposed diff/new content  
- [x] Uploads only after confirm  

## Out of scope (for now)

- Shipping vendor API keys or proxying a Cursor-owned LLM  
- Auto-executing SSH commands without confirmation  
- Sending entire remote directory trees to a model by default  

## Related code

| Piece | Path |
| --- | --- |
| Interface + DTOs | `src/UplinkFtp.Core/Services/Ai/` |
| Local fallback | `LocalAiAssistantService` |
| Cloud adapter | `CloudAiAssistantService` (requires BYOK) |
| Filter matcher | `AiFileFilterMatcher` |
| Protocol ops | `IRemoteProtocolClient` Rename/Read/Write/ExecuteShell |
| Settings / Assist UI | `SettingsDialog`, `AssistDialog` (5-tab hub) |
| Credential store | `ICredentialStore` / `WindowsCredentialStore` |
