import { type Currency, frankfurterCurrenciesResponseSchema } from '../schema';

export async function getCurrencies(): Promise<Currency[]> {
  try {
    // Fetch currencies from Frankfurter API
    const response = await fetch('https://api.frankfurter.app/currencies');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Validate response using Zod schema
    const validatedData = frankfurterCurrenciesResponseSchema.parse(data);
    
    // Transform the response object into Currency array
    // The API returns { "USD": "US Dollar", "EUR": "Euro", ... }
    const currencies: Currency[] = Object.entries(validatedData).map(([code, name]) => ({
      code,
      name
    }));
    
    // Sort currencies by code for consistent ordering
    return currencies.sort((a, b) => a.code.localeCompare(b.code));
    
  } catch (error) {
    console.error('Failed to fetch currencies:', error);
    throw error;
  }
}
