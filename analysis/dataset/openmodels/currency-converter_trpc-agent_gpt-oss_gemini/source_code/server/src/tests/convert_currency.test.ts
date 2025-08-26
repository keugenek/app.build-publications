import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq } from 'drizzle-orm';

const testInput = {
  amount: 100.5,
  source_currency: 'USD',
  target_currency: 'EUR',
} as const;

describe('convertCurrency handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return conversion output with numeric fields as numbers', async () => {
    const result = await convertCurrency(testInput);
    expect(result.amount).toBe(testInput.amount);
    expect(result.source_currency).toBe('USD');
    expect(result.target_currency).toBe('EUR');
    expect(result.converted_amount).toBe(testInput.amount); // rate 1
    expect(result.rate).toBe(1);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should persist a conversion record with correct numeric conversions', async () => {
    const result = await convertCurrency(testInput);
    // Find row by timestamp (created_at) which matches result.timestamp
    const rows = await db
      .select()
      .from(conversionsTable)
      .execute();
    // Find a record matching the input values
    const matching = rows.find(r =>
      parseFloat(r.amount) === testInput.amount &&
      r.source_currency === testInput.source_currency &&
      r.target_currency === testInput.target_currency
    );
    expect(matching).toBeDefined();
    if (matching) {
      expect(parseFloat(matching.amount)).toBe(testInput.amount);
      expect(matching.source_currency).toBe('USD');
      expect(matching.target_currency).toBe('EUR');
      expect(parseFloat(matching.converted_amount)).toBe(testInput.amount);
      expect(parseFloat(matching.rate)).toBe(1);
    }
    expect(rows).toHaveLength(1);
    const record = rows[0];
    expect(parseFloat(record.amount)).toBe(testInput.amount);
    expect(record.source_currency).toBe('USD');
    expect(record.target_currency).toBe('EUR');
    expect(parseFloat(record.converted_amount)).toBe(testInput.amount);
    expect(parseFloat(record.rate)).toBe(1);
  });
});
