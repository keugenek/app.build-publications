import { db } from '../db';
import { conversionHistoryTable } from '../db/schema';
import { type ConvertCurrencyInput, type ConversionResult } from '../schema';

interface FrankfurterResponse {
  amount?: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

export const convertCurrency = async (input: ConvertCurrencyInput): Promise<ConversionResult> => {
  try {
    // Fetch exchange rates from Frankfurter API
    const response = await fetch(
      `https://api.frankfurter.app/latest?from=${input.fromCurrency}&to=${input.toCurrency}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
    }

    const data: unknown = await response.json();
    
    // Type guard to ensure we have the expected structure
    if (typeof data !== 'object' || data === null || !('rates' in data)) {
      throw new Error('Invalid response from exchange rate API');
    }

    const typedData = data as FrankfurterResponse;
    
    // Check if the target currency rate exists
    if (!typedData.rates[input.toCurrency]) {
      throw new Error(`Exchange rate not found for ${input.fromCurrency} to ${input.toCurrency}`);
    }

    const exchangeRate = typedData.rates[input.toCurrency];
    const convertedAmount = parseFloat((input.amount * exchangeRate).toFixed(2));

    // Save conversion to history
    await db.insert(conversionHistoryTable)
      .values({
        amount: input.amount.toString(),
        fromCurrency: input.fromCurrency,
        toCurrency: input.toCurrency,
        convertedAmount: convertedAmount.toString(),
        exchangeRate: exchangeRate.toString(),
        timestamp: new Date()
      })
      .execute();

    return {
      amount: input.amount,
      fromCurrency: input.fromCurrency,
      toCurrency: input.toCurrency,
      convertedAmount,
      exchangeRate,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Currency conversion failed: ', error);
    throw error;
  }
};
