'use client'

import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard-layout'
import { AddManualPurchaseInvoiceDialog } from '@/components/add-manual-purchase-invoice-dialog'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/contexts/language-context'

export default function NewIncomingInvoicePage() {
  const router = useRouter()
  const { language } = useLanguage()

  return (
    <DashboardLayout>
      <div className="w-full max-w-[1600px] mx-auto space-y-6 px-2 sm:px-4">
        <Button
          variant="ghost"
          size="sm"
          className="text-[#0A2540] hover:bg-gray-100"
          onClick={() => router.push('/expenses')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === 'tr' ? 'Masraflar / Gelen faturalar' : 'Expenses / Incoming invoices'}
        </Button>
        <AddManualPurchaseInvoiceDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) router.push('/expenses')
          }}
          onSuccess={() => {
            toast.success(language === 'tr' ? 'Alış faturası eklendi.' : 'Purchase invoice added.')
            router.push('/expenses')
          }}
          mode="add"
          asPage
        />
      </div>
    </DashboardLayout>
  )
}
