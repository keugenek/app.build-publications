import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { type ConversionRequest, type ConversionResult, frankfurterExchangeResponseSchema } from '../schema';

export const convertCurrency = async (input: ConversionRequest): Promise<ConversionResult> => {
  try {
    // If converting to the same currency, use exchange rate of 1
    if (input.from_currency === input.to_currency) {
      const convertedAmount = input.amount;
      const exchangeRate = 1;

      // Store the conversion in database
      const result = await db.insert(conversionsTable)
        .values({
          amount: input.amount.toString(),
          from_currency: input.from_currency,
          to_currency: input.to_currency,
          exchange_rate: exchangeRate.toString(),
          converted_amount: convertedAmount.toString(),
        })
        .returning()
        .execute();

      const conversion = result[0];
      return {
        ...conversion,
        amount: parseFloat(conversion.amount),
        exchange_rate: parseFloat(conversion.exchange_rate),
        converted_amount: parseFloat(conversion.converted_amount),
      };
    }

    // Fetch exchange rate from Frankfurter API
    const apiUrl = `https://api.frankfurter.app/latest?from=${input.from_currency}&to=${input.to_currency}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status} ${response.statusText}`);
    }

    const apiData = await response.json();
    const parsedData = frankfurterExchangeResponseSchema.parse(apiData);

    // Extract exchange rate for the target currency
    const exchangeRate = parsedData.rates[input.to_currency];
    if (!exchangeRate) {
      throw new Error(`Exchange rate not found for currency pair ${input.from_currency}/${input.to_currency}`);
    }

    // Calculate converted amount
    const convertedAmount = input.amount * exchangeRate;

    // Store the conversion in database
    const result = await db.insert(conversionsTable)
      .values({
        amount: input.amount.toString(),
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        exchange_rate: exchangeRate.toString(),
        converted_amount: convertedAmount.toString(),
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const conversion = result[0];
    return {
      ...conversion,
      amount: parseFloat(conversion.amount),
      exchange_rate: parseFloat(conversion.exchange_rate),
      converted_amount: parseFloat(conversion.converted_amount),
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
};
