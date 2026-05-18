export const CORPORATE_PRODUCT_ORDER = ['isendai', 'erp', 'appointflow'] as const

export type CorporateProductKey = (typeof CORPORATE_PRODUCT_ORDER)[number]

/** Products shown on the corporate homepage; only isendAI is live today. */
export const CORPORATE_PRODUCT_AVAILABLE: Record<CorporateProductKey, boolean> = {
  isendai: true,
  erp: false,
  appointflow: false,
}

export const CORPORATE_PRODUCT_HREFS: Record<CorporateProductKey, string> = {
  isendai: '/products/isendai',
  erp: '/products/modulus-erp',
  appointflow: '/products/appointflow',
}
