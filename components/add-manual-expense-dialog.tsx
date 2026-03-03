'use client'

import { useState, useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useTenant } from '@/contexts/tenant-context'
import { useLanguage } from '@/contexts/language-context'
import { toast } from 'sonner'
import { Upload, Camera, Loader2, CheckCircle2, AlertCircle, Scan } from 'lucide-react'
import { compressImage, isImageFile } from '@/lib/image-utils'

interface Account {
  id: string
  name: string
  type: string
  currency: string
  current_balance: number
}

interface AddManualExpenseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddManualExpenseDialog({ open, onOpenChange, onSuccess }: AddManualExpenseDialogProps) {
  const { tenantId } = useTenant()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrScanned, setOcrScanned] = useState(false)
  const [autoFilledFields, setAutoFilledFields] = useState<Set<string>>(new Set())
  const [accounts, setAccounts] = useState<Account[]>([])
  const [projectsList, setProjectsList] = useState<{ id: string; name: string; code: string }[]>([])
  const [customersList, setCustomersList] = useState<{ id: string; company_title: string | null; name: string }[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    category: 'general',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    currency: 'TRY',
    account_id: '',
    project_id: '',
    customer_id: '',
    tax_rate: '20',
    notes: ''
  })

  useEffect(() => {
    if (open && tenantId) {
      fetchAccounts()
      supabase
        .from('projects')
        .select('id, name, code')
        .eq('tenant_id', tenantId)
        .in('status', ['planning', 'active'])
        .order('name')
        .then(({ data }) => setProjectsList(data || []))
      supabase
        .from('customers')
        .select('id, company_title, name')
        .eq('tenant_id', tenantId)
        .order('company_title')
        .then(({ data }) => setCustomersList(data || []))
    }
  }, [open, tenantId])

  async function fetchAccounts() {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name, type, currency, current_balance')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setAccounts(data || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!tenantId) {
      toast.error(t.common.noData)
      return
    }

    if (!formData.description || !formData.amount) {
      toast.error(t.expenses.fillRequiredFields)
      return
    }

    setLoading(true)

    try {
      const insertData: any = {
        tenant_id: tenantId,
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        payment_method: formData.payment_method,
        currency: formData.currency,
        tax_rate: parseFloat(formData.tax_rate),
        notes: formData.notes || null
      }

      if (formData.account_id) {
        insertData.account_id = formData.account_id
      }

      if (formData.project_id) {
        insertData.project_id = formData.project_id
      }

      if (formData.customer_id) {
        insertData.customer_id = formData.customer_id
      }

      const { error } = await supabase
        .from('expenses')
        .insert(insertData)

      if (error) throw error

      if (formData.customer_id) {
        const amount = parseFloat(formData.amount)
        if (amount > 0) {
          const { data: cust } = await supabase
            .from('customers')
            .select('balance')
            .eq('id', formData.customer_id)
            .eq('tenant_id', tenantId)
            .single()
          if (cust) {
            await supabase
              .from('customers')
              .update({ balance: Number(cust.balance ?? 0) + amount })
              .eq('id', formData.customer_id)
              .eq('tenant_id', tenantId)
          }
        }
      }

      toast.success(t.expenses.expenseAddedSuccess)
      onSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      console.error('Error adding expense:', error)
      toast.error(error.message || t.expenses.addExpenseError)
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      category: 'general',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      payment_method: 'cash',
      currency: 'TRY',
      account_id: '',
      project_id: '',
      customer_id: '',
      tax_rate: '20',
      notes: ''
    })
    setOcrScanned(false)
    setAutoFilledFields(new Set())
  }

  async function handleImageUpload(file: File) {
    if (!isImageFile(file)) {
      toast.error(t.expenses.invalidImageFile)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t.expenses.fileSizeLimit)
      return
    }

    setOcrLoading(true)

    try {
      console.log('[OCR] 🔄 Forcing fresh token refresh...')

      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshData.session) {
        console.error('[OCR] ❌ Token refresh failed:', refreshError)
        throw new Error(language === 'tr' ? 'Oturum yenilenemedi, lütfen tekrar giriş yapın.' : 'Could not refresh session, please log in again.')
      }

      const session = refreshData.session
      const accessToken = session.access_token

      console.log('[OCR] ✓ Fresh token obtained')
      console.log('[OCR] ✓ User ID:', session.user.id)
      console.log('[OCR] ✓ Token length:', accessToken.length)
      console.log('[OCR] ✓ Token preview (first 10 chars):', accessToken.substring(0, 10))
      console.log('[OCR] ✓ Token expiry:', new Date(session.expires_at! * 1000).toISOString())
      console.log('[OCR] 🚀 Calling edge function with tenant:', tenantId)

      const base64Image = await compressImage(file, 1)

      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

      console.log('[OCR] 📤 Sending request with headers:')
      console.log('[OCR]   Authorization: Bearer', accessToken.substring(0, 10) + '...')
      console.log('[OCR]   apikey:', anonKey ? 'Present (length: ' + anonKey.length + ')' : 'Missing')

      const { data: result, error: invokeError } = await supabase.functions.invoke('ocr-expense', {
        body: {
          image_base64: base64Image,
          tenant_id: tenantId,
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
          apikey: anonKey
        }
      })

      if (invokeError) {
        console.error('[OCR] Invoke Error:', {
          name: invokeError.name,
          message: invokeError.message,
          status: (invokeError as any).status,
        })

        let errorDetails = invokeError.message

        if ((invokeError as any).context) {
          try {
            const errorBody = await (invokeError as any).context.json()
            console.error('[OCR] Error Body:', errorBody)
            errorDetails = errorBody.error || errorDetails
          } catch (parseErr) {
            console.error('[OCR] Could not parse error body')
            try {
              const errorText = await (invokeError as any).context.text()
              console.error('[OCR] Error Text:', errorText)
              errorDetails = errorText || errorDetails
            } catch (textErr) {
              console.error('[OCR] Could not get error text')
            }
          }
        }

        throw new Error(errorDetails || 'Failed to invoke OCR function')
      }

      if (!result || !result.success) {
        console.error('[OCR] Failed:', result)
        throw new Error(result?.error || 'OCR failed')
      }

      const ocrData = result.data
      const fieldsToFill = new Set<string>()

      const newFormData = { ...formData }

      if (ocrData.vendor_name) {
        newFormData.description = ocrData.vendor_name + (ocrData.description ? ` - ${ocrData.description}` : '')
        fieldsToFill.add('description')
      }

      if (ocrData.total_amount) {
        newFormData.amount = ocrData.total_amount.toString()
        fieldsToFill.add('amount')
      }

      if (ocrData.date) {
        newFormData.expense_date = ocrData.date
        fieldsToFill.add('expense_date')
      }

      if (ocrData.category) {
        newFormData.category = ocrData.category
        fieldsToFill.add('category')
      }

      if (ocrData.currency) {
        newFormData.currency = ocrData.currency
        fieldsToFill.add('currency')
      }

      if (ocrData.tax_amount && ocrData.total_amount) {
        const taxRate = (ocrData.tax_amount / ocrData.total_amount) * 100
        if (taxRate <= 1) newFormData.tax_rate = '1'
        else if (taxRate <= 10) newFormData.tax_rate = '10'
        else if (taxRate <= 20) newFormData.tax_rate = '20'
        else newFormData.tax_rate = '0'
        fieldsToFill.add('tax_rate')
      }

      if (ocrData.vendor_name && ocrData.description) {
        newFormData.notes = `Scanned receipt: ${ocrData.vendor_name} (Confidence: ${Math.round(ocrData.confidence * 100)}%)`
      }

      setFormData(newFormData)
      setAutoFilledFields(fieldsToFill)
      setOcrScanned(true)

      toast.success(
        language === 'tr'
          ? `Fiş başarıyla tarandı! (Güven: ${Math.round(ocrData.confidence * 100)}%)`
          : `Receipt scanned successfully! (Confidence: ${Math.round(ocrData.confidence * 100)}%)`
      )
    } catch (error: any) {
      console.error('OCR Error Details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
      })

      let errorMessage = error.message || 'Unknown error'

      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        errorMessage = language === 'tr'
          ? 'Oturum doğrulanamadı. Lütfen sayfayı yenileyin ve tekrar deneyin.'
          : 'Session could not be verified. Please refresh the page and try again.'
      } else if (errorMessage.includes('OPENAI_API_KEY')) {
        errorMessage = language === 'tr'
          ? 'AI servisi yapılandırılmamış. Lütfen yöneticiyle iletişime geçin.'
          : 'AI service not configured. Please contact administrator.'
      }

      toast.error(
        language === 'tr'
          ? `Fiş okunamadı: ${errorMessage}`
          : `Could not read receipt: ${errorMessage}`
      )
    } finally {
      setOcrLoading(false)
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleImageUpload(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-blue-50 border-blue-200">
        <DialogHeader>
          <DialogTitle>{t.expenses.addExpense}</DialogTitle>
          <DialogDescription>
            {t.expenses.addExpenseDescription}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Scan className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-sm text-blue-900">
                  {t.expenses.aiReceiptScan}
                </span>
              </div>
              {ocrScanned && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t.expenses.receiptScanned}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
                disabled={ocrLoading}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={ocrLoading}
                className="flex-1"
              >
                {ocrLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.expenses.scanning}
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    {t.expenses.uploadReceipt}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.setAttribute('capture', 'environment')
                    fileInputRef.current.click()
                  }
                }}
                disabled={ocrLoading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            {ocrLoading && (
              <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>{t.expenses.aiAnalyzingReceipt}</span>
              </div>
            )}

            {ocrScanned && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{t.expenses.aiFilledFieldsNote}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">{t.expenses.category} *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => {
                setFormData({ ...formData, category: value })
                setAutoFilledFields(prev => {
                  const next = new Set(prev)
                  next.delete('category')
                  return next
                })
              }}
            >
              <SelectTrigger className={autoFilledFields.has('category') ? 'bg-blue-50 border-blue-300' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">{t.expenses.categories.general}</SelectItem>
                <SelectItem value="marketing">{t.expenses.categories.marketing}</SelectItem>
                <SelectItem value="personnel">{t.expenses.categories.personnel}</SelectItem>
                <SelectItem value="office">{t.expenses.categories.office}</SelectItem>
                <SelectItem value="tax">{t.expenses.categories.tax}</SelectItem>
                <SelectItem value="utilities">{t.expenses.categories.utilities}</SelectItem>
                <SelectItem value="rent">{t.expenses.categories.rent}</SelectItem>
                <SelectItem value="other">{t.expenses.categories.other}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t.expenses.description} *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value })
                setAutoFilledFields(prev => {
                  const next = new Set(prev)
                  next.delete('description')
                  return next
                })
              }}
              placeholder="Enter expense description"
              required
              className={autoFilledFields.has('description') ? 'bg-blue-50 border-blue-300' : ''}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.expenses.amount} *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  setFormData({ ...formData, amount: e.target.value })
                  setAutoFilledFields(prev => {
                    const next = new Set(prev)
                    next.delete('amount')
                    return next
                  })
                }}
                placeholder="0.00"
                required
                className={autoFilledFields.has('amount') ? 'bg-blue-50 border-blue-300' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">{t.settings.currency} *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => {
                  setFormData({ ...formData, currency: value, account_id: '' })
                  setAutoFilledFields(prev => {
                    const next = new Set(prev)
                    next.delete('currency')
                    return next
                  })
                }}
              >
                <SelectTrigger className={autoFilledFields.has('currency') ? 'bg-blue-50 border-blue-300' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_rate">Tax Rate (%) *</Label>
              <Select
                value={formData.tax_rate}
                onValueChange={(value) => {
                  setFormData({ ...formData, tax_rate: value })
                  setAutoFilledFields(prev => {
                    const next = new Set(prev)
                    next.delete('tax_rate')
                    return next
                  })
                }}
              >
                <SelectTrigger className={autoFilledFields.has('tax_rate') ? 'bg-blue-50 border-blue-300' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0%</SelectItem>
                  <SelectItem value="1">1%</SelectItem>
                  <SelectItem value="10">10%</SelectItem>
                  <SelectItem value="20">20%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expense_date">{t.expenses.expenseDate} *</Label>
              <Input
                id="expense_date"
                type="date"
                value={formData.expense_date}
                onChange={(e) => {
                  setFormData({ ...formData, expense_date: e.target.value })
                  setAutoFilledFields(prev => {
                    const next = new Set(prev)
                    next.delete('expense_date')
                    return next
                  })
                }}
                required
                className={autoFilledFields.has('expense_date') ? 'bg-blue-50 border-blue-300' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">{t.expenses.paymentMethod} *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => {
                  setFormData({ ...formData, payment_method: value, account_id: '' })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">{t.expenses.paymentMethods.cash}</SelectItem>
                  <SelectItem value="bank_transfer">{t.expenses.paymentMethods.bank_transfer}</SelectItem>
                  <SelectItem value="credit_card">{t.expenses.paymentMethods.credit_card}</SelectItem>
                  <SelectItem value="other">{t.expenses.paymentMethods.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(formData.payment_method === 'bank_transfer' || formData.payment_method === 'credit_card') && (
            <div className="space-y-2">
              <Label htmlFor="account_id">
                {formData.payment_method === 'bank_transfer' ? t.finance.accounts.bankName : 'Kredi Kartı'} *
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t.finance.transactions.account} />
                </SelectTrigger>
                <SelectContent>
                  {accounts
                    .filter(acc => acc.type === 'bank' && acc.currency === formData.currency)
                    .map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.currency})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {accounts.filter(acc => acc.type === 'bank' && acc.currency === formData.currency).length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {formData.currency} para birimi ile eşleşen banka hesabı bulunamadı. Lütfen Finans {">"} Hesaplar sayfasından {formData.currency} hesabı ekleyin.
                </p>
              )}
            </div>
          )}

          {projectsList.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="project_id">{language === 'tr' ? 'Proje' : 'Project'}</Label>
              <Select
                value={formData.project_id || 'none'}
                onValueChange={v => setFormData({ ...formData, project_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'tr' ? 'Proje secin (opsiyonel)' : 'Select project (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{language === 'tr' ? 'Proje yok' : 'No project'}</SelectItem>
                  {projectsList.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.code ? `[${p.code}] ` : ''}{p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {customersList.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="customer_id">{language === 'tr' ? 'Cariye yansıt (bakiye artar)' : 'Link to customer (adds to balance)'}</Label>
              <Select
                value={formData.customer_id || 'none'}
                onValueChange={v => setFormData({ ...formData, customer_id: v === 'none' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={language === 'tr' ? 'Cari secin (opsiyonel)' : 'Select customer (optional)'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{language === 'tr' ? 'Yok' : 'None'}</SelectItem>
                  {customersList.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.company_title || c.name || c.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t.expenses.notes}</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes (optional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading || ocrLoading}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" disabled={loading || ocrLoading}>
              {loading ? t.common.loading : (ocrScanned ? (language === 'tr' ? 'Onayla ve Kaydet' : 'Confirm & Save') : t.common.save)}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
