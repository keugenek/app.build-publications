import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { tables } from '../db/schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq, desc } from 'drizzle-orm';

// Helper to fetch the latest conversion record from DB
const getLastConversion = async () => {
  const results = await db.select().from(tables.conversions).orderBy(desc(tables.conversions.id)).limit(1).execute();
  return results[0];
};

describe('convertCurrency handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('converts amount with same currency (rate 1)', async () => {
    const input = { amount: 100, source_currency: 'USD' as const, target_currency: 'USD' as const };
    const result = await convertCurrency(input);

    expect(result.converted_amount).toBeCloseTo(100);
    expect(result.source_currency).toBe('USD');
    expect(result.target_currency).toBe('USD');

    const dbRecord = await getLastConversion();
    expect(parseFloat(dbRecord.amount)).toBeCloseTo(100);
    expect(parseFloat(dbRecord.converted_amount)).toBeCloseTo(100);
    expect(dbRecord.source_currency).toBe('USD');
    expect(dbRecord.target_currency).toBe('USD');
  });

  it('converts amount with different currency using mock rate 1.2', async () => {
    const input = { amount: 50, source_currency: 'EUR' as const, target_currency: 'GBP' as const };
    const result = await convertCurrency(input);

    const expected = parseFloat((50 * 1.2).toFixed(6));
    expect(result.converted_amount).toBeCloseTo(expected);
    expect(result.source_currency).toBe('EUR');
    expect(result.target_currency).toBe('GBP');

    const dbRecord = await getLastConversion();
    expect(parseFloat(dbRecord.amount)).toBeCloseTo(50);
    expect(parseFloat(dbRecord.converted_amount)).toBeCloseTo(expected);
    expect(dbRecord.source_currency).toBe('EUR');
    expect(dbRecord.target_currency).toBe('GBP');
  });
});
