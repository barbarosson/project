/**
 * Maps GIB/NES e-document status codes (often long lowercase strings) to i18n keys
 * so the UI shows human-readable labels instead of raw API values.
 */
const GIB_STATUS_TO_KEY: Record<string, string> = {
  envelopeiswaitingtobesendedtoreceiverbygib: 'statusWaitingToBeSentByGib',
  envelopeiswaitingtobesenttoreceiverbygib: 'statusWaitingToBeSentByGib',
  envelopeissenttoreceiverbygib: 'statusSentToReceiverByGib',
  envelopeisreceivedbyreceiver: 'statusReceivedByReceiver',
  envelopeisreceivedbygib: 'statusReceivedByGib',
  envelopeisrejected: 'rejected',
  envelopeiscancelled: 'cancelled',
}

/**
 * Returns the i18n key for a given raw status (e.g. from GIB API).
 * Prefer using getEdocStatusLabel with your t.edocuments object.
 */
export function getEdocStatusI18nKey(status: string): string {
  if (!status || typeof status !== 'string') return 'draft'
  const normalized = status.toLowerCase().trim()
  return GIB_STATUS_TO_KEY[normalized] ?? (normalized.length > 20 ? 'statusProcessing' : normalized)
}

/** Statuses where the process is considered completed/final; import button should be disabled for incoming. */
const PROCESS_COMPLETED_STATUSES = new Set([
  'none',
  'rejected',
  'cancelled',
  'envelopeisrejected',
  'envelopeiscancelled',
])

/**
 * Returns true when the e-document status indicates a completed/final process.
 * Use to disable "İçeri aktar" for incoming invoices in these states.
 */
export function isEdocProcessCompleted(status: string | null | undefined): boolean {
  if (status == null || typeof status !== 'string') return false
  const s = status.trim()
  if (s === '') return false
  return PROCESS_COMPLETED_STATUSES.has(s.toLowerCase())
}

/**
 * Returns a human-readable label for e-document status.
 * Pass the edocuments slice of your i18n object (e.g. t.edocuments).
 */
export function getEdocStatusLabel(
  status: string,
  t: Record<string, string>
): string {
  if (!status || typeof status !== 'string') return t.draft ?? 'Draft'
  const normalized = status.toLowerCase().trim()
  const key = GIB_STATUS_TO_KEY[normalized] ?? (normalized.length > 20 ? 'statusProcessing' : normalized)
  const label = t[key]
  if (label) return label
  // Fallback for short known keys (draft, sent, delivered, etc.)
  if (normalized.length <= 20) return status
  // Unknown long GIB status: show generic "Processing"
  return t.statusProcessing ?? 'Processing'
}
