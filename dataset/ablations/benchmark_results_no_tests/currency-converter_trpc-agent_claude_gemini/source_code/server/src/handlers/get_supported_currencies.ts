import { type SupportedCurrencies } from '../schema';

// Currency name mappings for better user experience
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
  'GBP': 'British Pound Sterling',
  'HKD': 'Hong Kong Dollar',
  'HUF': 'Hungarian Forint',
  'IDR': 'Indonesian Rupiah',
  'ILS': 'Israeli New Shekel',
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

export async function getSupportedCurrencies(): Promise<SupportedCurrencies> {
  try {
    // Fetch supported currencies from Frankfurter API
    const response = await fetch('https://api.frankfurter.app/currencies');
    
    if (!response.ok) {
      throw new Error(`Frankfurter API error: ${response.status} ${response.statusText}`);
    }

    const currenciesData = await response.json() as Record<string, string>;
    
    // Transform the response to match our schema
    const supportedCurrencies: SupportedCurrencies = Object.keys(currenciesData).map(code => ({
      code: code,
      name: CURRENCY_NAMES[code] || currenciesData[code] || code // Use our mapping first, then API data, then code as fallback
    }));

    return supportedCurrencies;
  } catch (error) {
    console.error('Failed to fetch supported currencies:', error);
    throw error;
  }
}
