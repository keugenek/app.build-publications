import { type SupportedCurrencies } from '../schema';

// Currency code to full name mapping - comprehensive list based on common currencies
const CURRENCY_NAMES: Record<string, string> = {
  'AUD': 'Australian Dollar',
  'BGN': 'Bulgarian Lev',
  'BRL': 'Brazilian Real',
  'CAD': 'Canadian Dollar',
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Yuan',
  'CZK': 'Czech Koruna',
  'DKK': 'Danish Krone',
  'EUR': 'Euro',
  'GBP': 'British Pound',
  'HKD': 'Hong Kong Dollar',
  'HRK': 'Croatian Kuna',
  'HUF': 'Hungarian Forint',
  'IDR': 'Indonesian Rupiah',
  'ILS': 'Israeli Shekel',
  'INR': 'Indian Rupee',
  'ISK': 'Icelandic Krona',
  'JPY': 'Japanese Yen',
  'KRW': 'South Korean Won',
  'MXN': 'Mexican Peso',
  'MYR': 'Malaysian Ringgit',
  'NOK': 'Norwegian Krone',
  'NZD': 'New Zealand Dollar',
  'PHP': 'Philippine Peso',
  'PLN': 'Polish Zloty',
  'RON': 'Romanian Leu',
  'SEK': 'Swedish Krona',
  'SGD': 'Singapore Dollar',
  'THB': 'Thai Baht',
  'TRY': 'Turkish Lira',
  'USD': 'US Dollar',
  'ZAR': 'South African Rand'
};

// In-memory cache with timestamp
let currencyCache: { data: SupportedCurrencies; timestamp: number } | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

// Export function to clear cache for testing
export const clearCache = () => {
  currencyCache = null;
};

/**
 * Handler for retrieving list of supported currencies.
 * This handler will:
 * 1. Check cache first (24 hour TTL)
 * 2. Fetch the list of supported currencies from Frankfurter API
 * 3. Cache the result to reduce API calls
 * 4. Return formatted list of currency codes with their full names
 */
export async function getSupportedCurrencies(): Promise<SupportedCurrencies> {
  try {
    // Check cache first
    if (currencyCache && (Date.now() - currencyCache.timestamp) < CACHE_DURATION_MS) {
      return currencyCache.data;
    }

    // Fetch supported currencies from Frankfurter API
    const response = await fetch('https://api.frankfurter.app/currencies');
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
    }

    const currencies = await response.json() as Record<string, string>;

    // Convert to our expected format, using our currency names mapping as fallback
    const supportedCurrencies: SupportedCurrencies = Object.keys(currencies).map(code => ({
      code: code as any, // Type assertion since we know these are valid currency codes
      name: CURRENCY_NAMES[code] || currencies[code] || code // Use our mapping, fallback to API, then code
    })).sort((a, b) => a.code.localeCompare(b.code)); // Sort alphabetically by code

    // Update cache
    currencyCache = {
      data: supportedCurrencies,
      timestamp: Date.now()
    };

    return supportedCurrencies;
  } catch (error) {
    console.error('Failed to fetch supported currencies:', error);
    
    // Fallback to common currencies if API fails
    const fallbackCurrencies: SupportedCurrencies = [
      { code: 'AUD', name: 'Australian Dollar' },
      { code: 'CAD', name: 'Canadian Dollar' },
      { code: 'CHF', name: 'Swiss Franc' },
      { code: 'CNY', name: 'Chinese Yuan' },
      { code: 'EUR', name: 'Euro' },
      { code: 'GBP', name: 'British Pound' },
      { code: 'JPY', name: 'Japanese Yen' },
      { code: 'USD', name: 'US Dollar' }
    ];

    return fallbackCurrencies;
  }
}
