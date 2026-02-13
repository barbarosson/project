/**
 * Turkish Tax ID, IBAN, and ID Number Validation Utilities
 */

/**
 * Validates Turkish Tax Number (VKN - Vergi Kimlik Numarası)
 * VKN is 10 digits with a specific checksum algorithm
 */
export function validateVKN(vkn: string): boolean {
  if (!vkn || vkn.length !== 10 || !/^\d{10}$/.test(vkn)) {
    return false
  }

  const digits = vkn.split('').map(Number)
  let sum = 0

  for (let i = 0; i < 9; i++) {
    const digit = digits[i]
    const temp = (digit + (9 - i)) % 10
    sum += (temp * Math.pow(2, 9 - i)) % 9
    if (temp !== 0 && (temp * Math.pow(2, 9 - i)) % 9 === 0) {
      sum += 9
    }
  }

  const checksum = (10 - (sum % 10)) % 10
  return checksum === digits[9]
}

/**
 * Validates Turkish ID Number (TCKN - T.C. Kimlik Numarası)
 * TCKN is 11 digits with specific validation rules
 */
export function validateTCKN(tckn: string): boolean {
  if (!tckn || tckn.length !== 11 || !/^\d{11}$/.test(tckn)) {
    return false
  }

  const digits = tckn.split('').map(Number)

  if (digits[0] === 0) {
    return false
  }

  let sumOdd = 0
  let sumEven = 0

  for (let i = 0; i < 9; i++) {
    if (i % 2 === 0) {
      sumOdd += digits[i]
    } else {
      sumEven += digits[i]
    }
  }

  const checksum10 = ((sumOdd * 7) - sumEven) % 10
  if (checksum10 !== digits[9]) {
    return false
  }

  const sumAll = digits.slice(0, 10).reduce((acc, val) => acc + val, 0)
  const checksum11 = sumAll % 10
  return checksum11 === digits[10]
}

/**
 * Validates Turkish IBAN (International Bank Account Number)
 * Turkish IBANs start with TR and are 26 characters long
 */
export function validateTurkishIBAN(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()

  if (!cleanIban || cleanIban.length !== 26) {
    return false
  }

  if (!cleanIban.startsWith('TR')) {
    return false
  }

  if (!/^TR\d{24}$/.test(cleanIban)) {
    return false
  }

  const rearranged = cleanIban.slice(4) + cleanIban.slice(0, 4)

  const numericString = rearranged
    .split('')
    .map(char => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) {
        return (code - 55).toString()
      }
      return char
    })
    .join('')

  let remainder = BigInt(numericString) % BigInt(97)
  return remainder === BigInt(1)
}

/**
 * Formats IBAN with spaces for display
 */
export function formatIBAN(iban: string): string {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  return cleanIban.match(/.{1,4}/g)?.join(' ') || cleanIban
}

/**
 * Determines if a tax number is VKN (10 digits) or TCKN (11 digits)
 */
export function getTaxIdType(taxId: string): 'VKN' | 'TCKN' | 'INVALID' {
  const clean = taxId.replace(/\D/g, '')

  if (clean.length === 10) {
    return validateVKN(clean) ? 'VKN' : 'INVALID'
  } else if (clean.length === 11) {
    return validateTCKN(clean) ? 'TCKN' : 'INVALID'
  }

  return 'INVALID'
}

/**
 * Validates tax number (either VKN or TCKN)
 */
export function validateTaxNumber(taxNumber: string): boolean {
  const clean = taxNumber.replace(/\D/g, '')

  if (clean.length === 10) {
    return validateVKN(clean)
  } else if (clean.length === 11) {
    return validateTCKN(clean)
  }

  return false
}
