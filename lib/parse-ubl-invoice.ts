/**
 * Parse UBL-TR invoice XML to extract line items (description, quantity, unit price, tax).
 * Used when importing incoming e-invoices into purchase invoices.
 */
export interface ParsedUblLine {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  total: number
}

export function parseUblInvoiceLines(xml: string): ParsedUblLine[] {
  const lines: ParsedUblLine[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const sel = (el: Element | Document, ...names: string[]) => {
    for (const name of names) {
      const found = el.querySelector(`${name}, cbc\\:${name}, *[local-name()="${name}"]`)
      if (found) return found.textContent?.trim() ?? ''
    }
    return ''
  }
  const invLines = doc.querySelectorAll(
    'InvoiceLine, [id*="InvoiceLine"], cac\\:InvoiceLine, *[local-name()="InvoiceLine"]'
  )
  if (invLines.length === 0) {
    const noteEls = doc.querySelectorAll('Note, cbc\\:Note, *[local-name()="Note"]')
    const qtyEls = doc.querySelectorAll(
      'InvoicedQuantity, cbc\\:InvoicedQuantity, *[local-name()="InvoicedQuantity"]'
    )
    const amountEls = doc.querySelectorAll(
      'LineExtensionAmount, cbc\\:LineExtensionAmount, *[local-name()="LineExtensionAmount"]'
    )
    const maxLen = Math.max(noteEls.length, qtyEls.length, amountEls.length, 1)
    for (let i = 0; i < maxLen; i++) {
      const desc = noteEls[i]?.textContent?.trim() || ''
      const qtyStr = qtyEls[i]?.textContent?.trim() || '1'
      const amountStr = amountEls[i]?.textContent?.trim() || '0'
      const numQty = parseFloat(qtyStr.replace(',', '.')) || 1
      const lineTotal = parseFloat(amountStr.replace(',', '.')) || 0
      const unitPrice = numQty > 0 ? lineTotal / numQty : 0
      const taxRate = 18
      const taxAmount = Math.round((lineTotal * (taxRate / (100 + taxRate))) * 100) / 100
      const total = lineTotal + taxAmount
      lines.push({
        description: desc || `Satır ${i + 1}`,
        quantity: numQty,
        unit_price: unitPrice,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
      })
    }
    return lines
  }
  invLines.forEach((el) => {
    const desc =
      el.querySelector(
        'Note, cbc\\:Note, *[local-name()="Note"], Item\\:Description, *[local-name()="Description"]'
      )?.textContent?.trim() || ''
    const qtyStr =
      el.querySelector(
        'InvoicedQuantity, cbc\\:InvoicedQuantity, *[local-name()="InvoicedQuantity"]'
      )?.textContent?.trim() || '1'
    const amtStr =
      el.querySelector(
        'LineExtensionAmount, cbc\\:LineExtensionAmount, *[local-name()="LineExtensionAmount"]'
      )?.textContent?.trim() || '0'
    const taxAmtStr =
      el.querySelector(
        'TaxAmount, cbc\\:TaxAmount, *[local-name()="TaxAmount"]'
      )?.textContent?.trim() || ''
    const numQty = parseFloat(qtyStr.replace(',', '.')) || 1
    const lineTotal = parseFloat(amtStr.replace(',', '.')) || 0
    const unitPrice = numQty > 0 ? lineTotal / numQty : 0
    const taxAmount = taxAmtStr ? parseFloat(taxAmtStr.replace(',', '.')) : 0
    const total = lineTotal + taxAmount
    const taxRate =
      lineTotal > 0 && taxAmount > 0
        ? Math.round((taxAmount / lineTotal) * 10000) / 100
        : 18
    lines.push({
      description: desc || 'Kalem',
      quantity: numQty,
      unit_price: unitPrice,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total,
    })
  })
  return lines
}
