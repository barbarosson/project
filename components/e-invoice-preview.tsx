'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { QrCode } from 'lucide-react'

interface LineItem {
  product_name: string
  description?: string
  quantity: number
  unit_price: number
  vat_rate: number
  line_total: number
  vat_amount: number
  total_with_vat: number
}

interface Customer {
  company_title?: string
  name: string
  tax_office?: string
  tax_number?: string
  address?: string
}

interface EInvoicePreviewProps {
  isOpen: boolean
  onClose: () => void
  invoice: {
    invoice_number: string
    issue_date: string
    due_date: string
    subtotal: number
    total_vat: number
    amount: number
    notes?: string
  }
  customer: Customer
  lineItems: LineItem[]
}

export function EInvoicePreview({ isOpen, onClose, invoice, customer, lineItems }: EInvoicePreviewProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>E-Invoice Preview</DialogTitle>
          <DialogDescription>
            Electronic invoice document (E-Fatura)
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white border-2 border-gray-300 p-8 space-y-6">
          <div className="flex items-start justify-between border-b-2 border-gray-300 pb-4">
            <div>
              <h1 className="text-3xl font-bold text-[#0D1B2A]">E-FATURA</h1>
              <p className="text-sm text-gray-600 mt-1">Electronic Invoice</p>
              <Badge className="mt-2 bg-[#2ECC71]">GİB Onaylı</Badge>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Fatura No</div>
              <div className="text-2xl font-bold text-[#0D1B2A]">{invoice.invoice_number}</div>
              <div className="mt-2 text-sm text-gray-600">Düzenleme Tarihi</div>
              <div className="font-semibold">{new Date(invoice.issue_date).toLocaleDateString('tr-TR')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-gray-300 p-4 rounded">
              <h3 className="font-bold text-[#0D1B2A] mb-3">SATICI BİLGİLERİ</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-semibold">Ünvan:</span> MODULUS ERP Ltd. Şti.</div>
                <div><span className="font-semibold">Vergi Dairesi:</span> Kadıköy V.D.</div>
                <div><span className="font-semibold">VKN:</span> 1234567890</div>
                <div><span className="font-semibold">Adres:</span> Atatürk Cad. No:123 Kadıköy/İstanbul</div>
                <div><span className="font-semibold">Tel:</span> +90 216 123 4567</div>
              </div>
            </div>

            <div className="border border-gray-300 p-4 rounded">
              <h3 className="font-bold text-[#0D1B2A] mb-3">ALICI BİLGİLERİ</h3>
              <div className="space-y-1 text-sm">
                <div><span className="font-semibold">Ünvan:</span> {customer.company_title || customer.name}</div>
                <div><span className="font-semibold">Vergi Dairesi:</span> {customer.tax_office || 'N/A'}</div>
                <div><span className="font-semibold">VKN/TCKN:</span> {customer.tax_number || 'N/A'}</div>
                <div><span className="font-semibold">Adres:</span> {customer.address || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div>
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left text-xs">Ürün/Hizmet</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">Miktar</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">Birim Fiyat</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">Tutar</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">KDV %</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">KDV Tutarı</th>
                  <th className="border border-gray-300 p-2 text-right text-xs">Toplam</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2 text-sm">
                      <div className="font-medium">{item.product_name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-600">{item.description}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 p-2 text-right text-sm">{item.quantity}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm">${item.unit_price.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm">${item.line_total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm">{item.vat_rate}%</td>
                    <td className="border border-gray-300 p-2 text-right text-sm">${item.vat_amount.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-right text-sm font-semibold">${item.total_with_vat.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <QrCode size={80} className="text-gray-400" />
                <div className="text-xs text-gray-600">
                  <div>ETTN:</div>
                  <div className="font-mono">AB12-CD34-EF56-GH78</div>
                  <div className="mt-1">Bu belge elektronik</div>
                  <div>olarak imzalanmıştır.</div>
                </div>
              </div>
            </div>

            <div className="w-80 space-y-2 border border-gray-300 p-4 rounded">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ara Toplam:</span>
                <span className="font-semibold">${invoice.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Toplam KDV:</span>
                <span className="font-semibold">${invoice.total_vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                <span className="font-bold text-lg">GENEL TOPLAM:</span>
                <span className="font-bold text-lg text-[#2ECC71]">${invoice.amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t-2 border-gray-300 pt-4">
              <h3 className="font-bold text-sm mb-2">NOTLAR:</h3>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}

          <div className="border-t-2 border-gray-300 pt-4 text-center text-xs text-gray-500">
            <p>Bu belge 5070 sayılı elektronik imza kanunu gereğince güvenli elektronik imza ile imzalanmıştır.</p>
            <p className="mt-1">Faturanın aslı elektronik ortamda saklanmaktadır.</p>
            <p className="mt-2 font-semibold">Vade Tarihi: {new Date(invoice.due_date).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
