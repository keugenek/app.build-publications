import { type ConvertCurrencyInput, type ConversionResult } from '../schema';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import axios from 'axios';

// Simple ID generator function
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

export const convertCurrency = async (input: ConvertCurrencyInput): Promise<ConversionResult> => {
  try {
    // Call the Frankfurter API to get exchange rates
    const response = await axios.get(`https://api.frankfurter.app/latest`, {
      params: {
        amount: input.amount,
        from: input.from,
        to: input.to
      }
    });

    const rate = response.data.rates[input.to];
    const convertedAmount = input.amount * rate;
    
    const conversionResult: ConversionResult = {
      amount: input.amount,
      convertedAmount: convertedAmount,
      from: input.from,
      to: input.to,
      rate: rate,
      timestamp: new Date(response.data.date),
    };

    // Store the conversion in the database
    const conversionRecord = {
      id: generateId(),
      amount: input.amount.toString(), // Convert number to string for numeric column
      from_currency: input.from,
      to_currency: input.to,
      converted_amount: convertedAmount.toString(), // Convert number to string for numeric column
      rate: rate.toString(), // Convert number to string for numeric column
      timestamp: conversionResult.timestamp,
    };

    await db.insert(conversionsTable)
      .values(conversionRecord)
      .execute();

    return conversionResult;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw new Error('Failed to fetch exchange rates');
  }
};
