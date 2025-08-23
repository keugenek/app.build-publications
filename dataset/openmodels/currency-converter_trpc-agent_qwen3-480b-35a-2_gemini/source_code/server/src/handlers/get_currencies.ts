import { type Currency } from '../schema';
import axios from 'axios';

export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    // Fetch currencies from Frankfurter API
    const response = await axios.get('https://api.frankfurter.app/currencies');
    
    // Transform the response to match our schema
    const currencies: Currency[] = Object.entries(response.data).map(([code, name]) => ({
      code,
      name: name as string,
    }));
    
    return currencies;
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw new Error('Failed to fetch currencies');
  }
};
