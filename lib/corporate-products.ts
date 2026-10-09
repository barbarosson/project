export const CORPORATE_PRODUCT_ORDER = [
  'isendai',
  'digitalLegacy',
  'seekdesk',
  'erp',
  'appointflow',
] as const

export type CorporateProductKey = (typeof CORPORATE_PRODUCT_ORDER)[number]

/** Products shown on the corporate homepage. */
export const CORPORATE_PRODUCT_AVAILABLE: Record<CorporateProductKey, boolean> = {
  isendai: true,
  digitalLegacy: true,
  seekdesk: true,
  erp: false,
  appointflow: false,
}

export const CORPORATE_PRODUCT_HREFS: Record<CorporateProductKey, string> = {
  isendai: '/products/isendai',
  digitalLegacy: '/products/digital-legacy',
  seekdesk: '/products/seekdesk',
  erp: '/products/modulus-erp',
  appointflow: '/products/appointflow',
}
