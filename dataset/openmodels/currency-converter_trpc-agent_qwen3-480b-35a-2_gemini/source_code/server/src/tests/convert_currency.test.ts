import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { type ConvertCurrencyInput } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq } from 'drizzle-orm';

// Test input with real currencies supported by the API
const testInput: ConvertCurrencyInput = {
  amount: 100,
  from: 'USD',
  to: 'EUR'
};

describe('convertCurrency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should convert currency and return the correct result', async () => {
    const result = await convertCurrency(testInput);

    // Basic field validation
    expect(result.amount).toEqual(100);
    expect(result.from).toEqual('USD');
    expect(result.to).toEqual('EUR');
    expect(typeof result.rate).toBe('number');
    expect(result.rate).toBeGreaterThan(0);
    expect(typeof result.convertedAmount).toBe('number');
    expect(result.convertedAmount).toBeGreaterThan(0);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should save conversion to database', async () => {
    const result = await convertCurrency(testInput);

    // Query the database to check if the conversion was saved
    const conversions = await db.select()
      .from(conversionsTable)
      .where(eq(conversionsTable.from_currency, 'USD'))
      .execute();

    expect(conversions).toHaveLength(1);
    expect(parseFloat(conversions[0].amount)).toEqual(result.amount);
    expect(conversions[0].from_currency).toEqual('USD');
    expect(conversions[0].to_currency).toEqual('EUR');
    expect(parseFloat(conversions[0].converted_amount)).toEqual(result.convertedAmount);
    expect(parseFloat(conversions[0].rate)).toEqual(result.rate);
    expect(conversions[0].timestamp).toBeInstanceOf(Date);
  });

  it('should handle invalid currency codes properly', async () => {
    const invalidInput: ConvertCurrencyInput = {
      amount: 100,
      from: 'INVALID',
      to: 'EUR'
    };

    await expect(convertCurrency(invalidInput)).rejects.toThrow();
  });
});
