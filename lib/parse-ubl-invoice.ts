/**
 * Parse UBL-TR invoice XML to extract line items (description, quantity, unit price, tax).
 * Used when importing incoming e-invoices into purchase invoices.
 * Uses localName to avoid invalid CSS selectors (e.g. local-name() is XPath, not CSS).
 */
export interface ParsedUblLine {
  description: string
  quantity: number
  unit_price: number
  tax_rate: number
  tax_amount: number
  total: number
}

function getElementsByLocalName(root: Document | Element, localName: string): Element[] {
  const out: Element[] = []
  const walk = (node: Node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return
    const el = node as Element
    if (el.localName === localName) out.push(el)
    for (let i = 0; i < el.children.length; i++) walk(el.children[i])
  }
  walk(root)
  return out
}

function getFirstTextByLocalNames(el: Element, ...localNames: string[]): string {
  for (const name of localNames) {
    const child = getElementsByLocalName(el, name)[0]
    if (child) return child.textContent?.trim() ?? ''
  }
  return ''
}

export function parseUblInvoiceLines(xml: string): ParsedUblLine[] {
  const lines: ParsedUblLine[] = []
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const invLines = getElementsByLocalName(doc, 'InvoiceLine')
  if (invLines.length === 0) {
    const noteEls = getElementsByLocalName(doc, 'Note')
    const qtyEls = getElementsByLocalName(doc, 'InvoicedQuantity')
    const amountEls = getElementsByLocalName(doc, 'LineExtensionAmount')
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
      getFirstTextByLocalNames(el, 'Note', 'Description') || ''
    const qtyStr =
      getFirstTextByLocalNames(el, 'InvoicedQuantity') || '1'
    const amtStr =
      getFirstTextByLocalNames(el, 'LineExtensionAmount') || '0'
    const taxAmtStr =
      getFirstTextByLocalNames(el, 'TaxAmount') || ''
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
