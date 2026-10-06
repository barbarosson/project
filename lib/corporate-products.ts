export const CORPORATE_PRODUCT_ORDER = ['isendai', 'digitalLegacy', 'erp', 'appointflow'] as const

export type CorporateProductKey = (typeof CORPORATE_PRODUCT_ORDER)[number]

/** Products shown on the corporate homepage; only isendAI is live today. */
export const CORPORATE_PRODUCT_AVAILABLE: Record<CorporateProductKey, boolean> = {
  isendai: true,
  digitalLegacy: true,
  erp: false,
  appointflow: false,
}

export const CORPORATE_PRODUCT_HREFS: Record<CorporateProductKey, string> = {
  isendai: '/products/isendai',
  digitalLegacy: '/products/digital-legacy',
  erp: '/products/modulus-erp',
  appointflow: '/products/appointflow',
}
