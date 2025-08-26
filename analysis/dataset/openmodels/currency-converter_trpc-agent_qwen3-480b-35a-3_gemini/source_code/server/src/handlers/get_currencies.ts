import axios from 'axios';
import { type Currency } from '../schema';

export const getCurrencies = async (): Promise<Currency[]> => {
  try {
    // Fetch available currencies from Frankfurter API
    const response = await axios.get('https://api.frankfurter.app/currencies');
    const currenciesData = response.data;
    
    // Convert the response to our Currency type
    return Object.entries(currenciesData).map(([code, name]) => ({
      code,
      name: name as string,
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch currencies: ${error.message || error}`);
  }
};
