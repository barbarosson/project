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

/** Parse decimal from UBL (allows "1234.56", "1234,56", "1.234,56"). */
function parseDecimal(value: string): number {
  if (!value || typeof value !== 'string') return 0
  const trimmed = value.trim().replace(/\s/g, '')
  if (!trimmed) return 0
  const hasComma = trimmed.includes(',')
  const normalized = hasComma
    ? trimmed.replace(/\./g, '').replace(',', '.')
    : trimmed
  const num = parseFloat(normalized)
  return Number.isFinite(num) ? num : 0
}

/** Fallback: extract amounts from XML by regex when DOM parsing returns empty (e.g. namespace issues). */
function extractAmountsFromXml(xml: string): { amounts: number[]; quantities: number[] } {
  const amounts: number[] = []
  const quantities: number[] = []
  const amountRegex = /LineExtensionAmount[^>]*>([^<]+)</gi
  const qtyRegex = /InvoicedQuantity[^>]*>([^<]+)</gi
  let m
  while ((m = amountRegex.exec(xml)) !== null) amounts.push(parseDecimal(m[1]))
  while ((m = qtyRegex.exec(xml)) !== null) quantities.push(parseDecimal(m[1]) || 1)
  return { amounts, quantities }
}

export function parseUblInvoiceLines(xml: string): ParsedUblLine[] {
  const lines: ParsedUblLine[] = []
  if (!xml || typeof xml !== 'string') return lines
  const parser = new DOMParser()
  const doc = parser.parseFromString(xml, 'text/xml')
  const invLines = getElementsByLocalName(doc, 'InvoiceLine')
  const regexFallback = extractAmountsFromXml(xml)
  const lineAmounts =
    invLines.length > 0 && regexFallback.amounts.length === invLines.length + 1
      ? regexFallback.amounts.slice(1)
      : regexFallback.amounts
  const lineQuantities =
    invLines.length > 0 && regexFallback.quantities.length === invLines.length + 1
      ? regexFallback.quantities.slice(1)
      : regexFallback.quantities
  const useRegexAmounts = lineAmounts.length > 0 && lineAmounts.some((a) => a > 0)
  if (invLines.length === 0) {
    const noteEls = getElementsByLocalName(doc, 'Note')
    const qtyEls = getElementsByLocalName(doc, 'InvoicedQuantity')
    const amountEls = getElementsByLocalName(doc, 'LineExtensionAmount')
    const maxLen = Math.max(noteEls.length, qtyEls.length, amountEls.length, lineAmounts.length, 1)
    for (let i = 0; i < maxLen; i++) {
      const desc = noteEls[i]?.textContent?.trim() || ''
      const qtyStr = qtyEls[i]?.textContent?.trim() || '1'
      const amountStr = amountEls[i]?.textContent?.trim() || '0'
      let numQty = parseDecimal(qtyStr) || 1
      let lineTotal = parseDecimal(amountStr)
      if (useRegexAmounts && lineAmounts[i] !== undefined) {
        lineTotal = lineAmounts[i]
        if (lineQuantities[i] !== undefined) numQty = lineQuantities[i]
      }
      const unitPrice = numQty > 0 ? lineTotal / numQty : 0
      const taxRate = 18
      const taxAmount = Math.round((lineTotal * (taxRate / (100 + taxRate))) * 100) / 100
      const total = Math.round((lineTotal + taxAmount) * 100) / 100
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
  invLines.forEach((el, idx) => {
    const desc = getFirstTextByLocalNames(el, 'Note', 'Description', 'Name') || ''
    const itemEl = getElementsByLocalName(el, 'Item')[0]
    const itemDesc = itemEl ? getFirstTextByLocalNames(itemEl, 'Description', 'Name') : ''
    const description = (desc || itemDesc || 'Kalem').trim()
    const qtyStr = getFirstTextByLocalNames(el, 'InvoicedQuantity') || '1'
    const amtStr = getFirstTextByLocalNames(el, 'LineExtensionAmount') || '0'
    const priceAmountStr = getFirstTextByLocalNames(el, 'PriceAmount') || ''
    const taxAmtStr = getFirstTextByLocalNames(el, 'TaxAmount') || ''
    let numQty = parseDecimal(qtyStr) || 1
    let lineTotal = parseDecimal(amtStr)
      if (useRegexAmounts && lineAmounts[idx] !== undefined) {
        lineTotal = lineAmounts[idx]
        if (lineQuantities[idx] !== undefined) numQty = lineQuantities[idx]
      }
    const priceAmount = parseDecimal(priceAmountStr)
    const unitPrice =
      numQty > 0
        ? priceAmount > 0
          ? priceAmount
          : lineTotal / numQty
        : 0
    const taxAmount = parseDecimal(taxAmtStr)
    const total = Math.round((lineTotal + taxAmount) * 100) / 100
    const taxRate =
      lineTotal > 0 && taxAmount > 0
        ? Math.round((taxAmount / lineTotal) * 10000) / 100
        : 18
    lines.push({
      description: description || 'Kalem',
      quantity: numQty,
      unit_price: Math.round(unitPrice * 100) / 100,
      tax_rate: taxRate,
      tax_amount: Math.round(taxAmount * 100) / 100,
      total,
    })
  })
  return lines
}
