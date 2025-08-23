import axios from 'axios';
import { type ConvertCurrencyInput, type CurrencyConversionResult } from '../schema';

export const convertCurrency = async (input: ConvertCurrencyInput): Promise<CurrencyConversionResult> => {
  try {
    // Fetch exchange rates from Frankfurter API
    const response = await axios.get(`https://api.frankfurter.app/latest`, {
      params: {
        amount: input.amount,
        from: input.from,
        to: input.to
      }
    });

    const { rates, date } = response.data;
    const exchangeRate = rates[input.to];
    const convertedAmount = input.amount * exchangeRate;

    return {
      amount: input.amount,
      from: input.from,
      to: input.to,
      convertedAmount: parseFloat(convertedAmount.toFixed(2)),
      exchangeRate: parseFloat(exchangeRate.toFixed(6)),
      timestamp: new Date(date),
    };
  } catch (error: any) {
    throw new Error(`Failed to convert currency: ${error.message || error}`);
  }
};
