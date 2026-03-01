/**
 * Currency utilities for multi-currency support
 * Base currency: MKD (Macedonian Denar)
 */

import { getCurrentLanguage } from './i18n';

export type Currency = 'MKD' | 'TRY' | 'EUR';
export type Language = 'mk' | 'tr' | 'en';

// Currency exchange rates (base: MKD)
const EXCHANGE_RATES: Record<Currency, number> = {
  MKD: 1,        // Base currency
  TRY: 0.55,     // 1 MKD = 0.55 TRY (approximate)
  EUR: 0.016,    // 1 MKD = 0.016 EUR (1 EUR ≈ 61 MKD)
};

// Language to currency mapping
const LANGUAGE_TO_CURRENCY: Record<Language, Currency> = {
  mk: 'MKD',  // Macedonian → Macedonian Denar
  tr: 'TRY',  // Turkish → Turkish Lira
  en: 'EUR',  // English → Euro
};

/**
 * Get currency based on current language
 */
export function getCurrencyForLanguage(lang: string): Currency {
  const language = lang.toLowerCase() as Language;
  return LANGUAGE_TO_CURRENCY[language] || 'MKD';
}

/**
 * Convert amount from MKD to target currency
 * @param amountInMKD - Amount in Macedonian Denar
 * @param targetCurrency - Target currency code
 * @returns Converted amount
 */
export function convertCurrency(amountInMKD: number, targetCurrency: Currency): number {
  const rate = EXCHANGE_RATES[targetCurrency];
  return Math.round(amountInMKD * rate);
}

/**
 * Format currency amount with currency code
 * @param amountInMKD - Amount in Macedonian Denar (base currency)
 * @param language - Current language (optional, auto-detected if not provided)
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted currency string (e.g., "150 MKD", "83 TRY", "2 EUR")
 */
export function formatCurrency(
  amountInMKD: number,
  language?: string,
  showDecimals: boolean = false
): string {
  const lang = language || getCurrentLanguage();
  const currency = getCurrencyForLanguage(lang);
  const convertedAmount = convertCurrency(amountInMKD, currency);
  
  if (showDecimals) {
    return `${convertedAmount.toFixed(2)} ${currency}`;
  }
  
  return `${convertedAmount} ${currency}`;
}

/**
 * Get currency symbol (text-based, no special characters)
 */
export function getCurrencySymbol(language?: string): string {
  const lang = language || getCurrentLanguage();
  return getCurrencyForLanguage(lang);
}

/**
 * Parse currency input and convert to MKD
 * @param amount - Amount in current currency
 * @param language - Current language (optional, auto-detected if not provided)
 * @returns Amount in MKD
 */
export function parseToMKD(amount: number, language?: string): number {
  const lang = language || getCurrentLanguage();
  const currency = getCurrencyForLanguage(lang);
  const rate = EXCHANGE_RATES[currency];
  return Math.round(amount / rate);
}
