import { db } from '../db';
import { currencyConversionsTable } from '../db/schema';
import { type CurrencyConversionInput, type CurrencyConversionResult } from '../schema';

/**
 * Handler for converting currency amounts using current exchange rates.
 * This handler will:
 * 1. Fetch current exchange rate from Frankfurter API for the given currency pair
 * 2. Calculate the converted amount
 * 3. Store the conversion record in the database for history
 * 4. Return the conversion result
 */
export async function convertCurrency(input: CurrencyConversionInput): Promise<CurrencyConversionResult> {
  try {
    // Fetch exchange rate from Frankfurter API
    const apiUrl = `https://api.frankfurter.app/latest?from=${input.from_currency}&to=${input.to_currency}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rate: ${response.status} ${response.statusText}`);
    }
    
    const exchangeData = await response.json() as any;
    
    // Validate that we got the expected data structure
    if (!exchangeData.rates || typeof exchangeData.rates[input.to_currency] !== 'number') {
      throw new Error(`Invalid exchange rate data received for ${input.from_currency} to ${input.to_currency}`);
    }
    
    const exchangeRate = exchangeData.rates[input.to_currency] as number;
    const convertedAmount = input.amount * exchangeRate;
    const conversionDate = new Date(exchangeData.date as string);
    
    // Store the conversion record in the database
    const result = await db.insert(currencyConversionsTable)
      .values({
        amount: input.amount.toString(), // Convert number to string for numeric column
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        exchange_rate: exchangeRate.toString(), // Convert number to string for numeric column
        converted_amount: convertedAmount.toString(), // Convert number to string for numeric column
        conversion_date: conversionDate.toISOString().split('T')[0] // Format as YYYY-MM-DD for date column
      })
      .returning()
      .execute();
    
    // Convert numeric fields back to numbers before returning
    const conversion = result[0];
    return {
      id: conversion.id,
      amount: parseFloat(conversion.amount), // Convert string back to number
      from_currency: conversion.from_currency,
      to_currency: conversion.to_currency,
      exchange_rate: parseFloat(conversion.exchange_rate), // Convert string back to number
      converted_amount: parseFloat(conversion.converted_amount), // Convert string back to number
      conversion_date: new Date(conversion.conversion_date),
      created_at: conversion.created_at
    };
  } catch (error) {
    console.error('Currency conversion failed:', error);
    throw error;
  }
}
