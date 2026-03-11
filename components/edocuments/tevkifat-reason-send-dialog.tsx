'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WITHHOLDING_REASON_CODES } from '@/lib/invoice-line-codes'
import { sendEInvoiceFromInvoiceId } from '@/lib/send-einvoice-from-invoice'
import { Loader2, Send } from 'lucide-react'

export interface TevkifatReasonSendDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  tenantId: string
  invoiceId: string
  /** Varsayılan tevkifat nedeni (satırlardan veya '9015') */
  defaultReasonCode?: string | null
  language?: 'tr' | 'en'
  onSent?: () => void
  onError?: (message: string) => void
}

export function TevkifatReasonSendDialog({
  open,
  onOpenChange,
  tenantId,
  invoiceId,
  defaultReasonCode,
  language = 'tr',
  onSent,
  onError,
}: TevkifatReasonSendDialogProps) {
  const [reasonCode, setReasonCode] = useState<string>('9015')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (open) {
      const code = (defaultReasonCode && defaultReasonCode.trim()) || '9015'
      const valid = WITHHOLDING_REASON_CODES.some((r) => r.code === code)
      setReasonCode(valid ? code : '9015')
    }
  }, [open, defaultReasonCode])

  async function handleSend() {
    if (!tenantId || !invoiceId) return
    setSending(true)
    try {
      const result = await sendEInvoiceFromInvoiceId(tenantId, invoiceId, {
        withholdingReasonCode: reasonCode,
      })
      if (result.success) {
        onOpenChange(false)
        onSent?.()
      } else {
        onError?.(result.error ?? (language === 'tr' ? 'Gönderim başarısız.' : 'Send failed.'))
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      onError?.(msg)
    } finally {
      setSending(false)
    }
  }

  const isTr = language === 'tr'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isTr ? 'Tevkifat nedeni seçin' : 'Select withholding reason'}
          </DialogTitle>
          <DialogDescription>
            {isTr
              ? 'E-fatura portalına gönderilecek tevkifat nedenini listeden seçin.'
              : 'Select the withholding reason to send to the e-invoice portal.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="tevkifat-reason">
              {isTr ? 'Tevkifat nedeni (e-fatura)' : 'Withholding reason (e-invoice)'}
            </Label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger id="tevkifat-reason" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WITHHOLDING_REASON_CODES.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.code} – {isTr ? r.labelTr : r.labelEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            {isTr ? 'İptal' : 'Cancel'}
          </Button>
          <Button type="button" onClick={handleSend} disabled={sending}>
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {isTr ? 'E-Fatura Gönder' : 'Send E-Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
