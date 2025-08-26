import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CreateExchangeRateInput } from '../schema';
import { getExchangeRates } from '../handlers/get_exchange_rates';

describe('getExchangeRates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const createTestExchangeRate = async (input: CreateExchangeRateInput) => {
    const result = await db.insert(exchangeRatesTable)
      .values({
        from_currency: input.from_currency,
        to_currency: input.to_currency,
        rate: input.rate.toString(),
        date: input.date.toISOString().split('T')[0] // Convert Date to YYYY-MM-DD string for date column
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should retrieve all exchange rates when no filters are provided', async () => {
    // Create test data
    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-01')
    });

    await createTestExchangeRate({
      from_currency: 'GBP',
      to_currency: 'USD',
      rate: 1.25,
      date: new Date('2024-01-02')
    });

    await createTestExchangeRate({
      from_currency: 'EUR',
      to_currency: 'JPY',
      rate: 158.50,
      date: new Date('2024-01-03')
    });

    const result = await getExchangeRates();

    expect(result).toHaveLength(3);
    
    // Verify all rates are returned and properly converted
    result.forEach(rate => {
      expect(rate.id).toBeDefined();
      expect(rate.from_currency).toBeDefined();
      expect(rate.to_currency).toBeDefined();
      expect(typeof rate.rate).toBe('number');
      expect(rate.date).toBeInstanceOf(Date);
      expect(rate.created_at).toBeInstanceOf(Date);
    });

    // Verify ordering (most recent date first)
    expect(result[0].date.getTime()).toBeGreaterThanOrEqual(result[1].date.getTime());
    expect(result[1].date.getTime()).toBeGreaterThanOrEqual(result[2].date.getTime());
  });

  it('should filter by from_currency only', async () => {
    // Create test data
    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-01')
    });

    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'GBP',
      rate: 0.80,
      date: new Date('2024-01-02')
    });

    await createTestExchangeRate({
      from_currency: 'EUR',
      to_currency: 'USD',
      rate: 1.18,
      date: new Date('2024-01-03')
    });

    const result = await getExchangeRates('USD');

    expect(result).toHaveLength(2);
    result.forEach(rate => {
      expect(rate.from_currency).toEqual('USD');
    });

    // Verify specific rates are correct
    expect(result.some(r => r.to_currency === 'EUR' && r.rate === 0.85)).toBe(true);
    expect(result.some(r => r.to_currency === 'GBP' && r.rate === 0.80)).toBe(true);
  });

  it('should filter by to_currency only', async () => {
    // Create test data
    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-01')
    });

    await createTestExchangeRate({
      from_currency: 'GBP',
      to_currency: 'EUR',
      rate: 1.15,
      date: new Date('2024-01-02')
    });

    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'GBP',
      rate: 0.80,
      date: new Date('2024-01-03')
    });

    const result = await getExchangeRates(undefined, 'EUR');

    expect(result).toHaveLength(2);
    result.forEach(rate => {
      expect(rate.to_currency).toEqual('EUR');
    });

    // Verify specific rates are correct
    expect(result.some(r => r.from_currency === 'USD' && r.rate === 0.85)).toBe(true);
    expect(result.some(r => r.from_currency === 'GBP' && r.rate === 1.15)).toBe(true);
  });

  it('should filter by both from_currency and to_currency', async () => {
    // Create test data
    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-01')
    });

    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.86,
      date: new Date('2024-01-02')
    });

    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'GBP',
      rate: 0.80,
      date: new Date('2024-01-03')
    });

    await createTestExchangeRate({
      from_currency: 'GBP',
      to_currency: 'EUR',
      rate: 1.15,
      date: new Date('2024-01-04')
    });

    const result = await getExchangeRates('USD', 'EUR');

    expect(result).toHaveLength(2);
    result.forEach(rate => {
      expect(rate.from_currency).toEqual('USD');
      expect(rate.to_currency).toEqual('EUR');
    });

    // Verify both USD->EUR rates are returned and ordered by date (most recent first)
    expect(result[0].rate).toEqual(0.86); // More recent date
    expect(result[1].rate).toEqual(0.85); // Earlier date
  });

  it('should return empty array when no matching rates exist', async () => {
    // Create some test data that won't match our filter
    await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-01')
    });

    const result = await getExchangeRates('JPY', 'CHF');

    expect(result).toHaveLength(0);
  });

  it('should handle multiple rates with same date correctly', async () => {
    const sameDate = new Date('2024-01-01');

    // Create multiple rates with the same date
    const rate1 = await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: sameDate
    });

    // Wait a tiny bit to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const rate2 = await createTestExchangeRate({
      from_currency: 'USD',
      to_currency: 'GBP',
      rate: 0.80,
      date: sameDate
    });

    const result = await getExchangeRates('USD');

    expect(result).toHaveLength(2);
    
    // Both should have the same date
    result.forEach(rate => {
      expect(rate.date.toDateString()).toEqual(sameDate.toDateString());
    });

    // Should be ordered by created_at when dates are equal (most recent first)
    expect(result[0].created_at.getTime()).toBeGreaterThanOrEqual(result[1].created_at.getTime());
  });

  it('should verify proper numeric conversion', async () => {
    await createTestExchangeRate({
      from_currency: 'EUR',
      to_currency: 'JPY',
      rate: 158.123456,
      date: new Date('2024-01-01')
    });

    const result = await getExchangeRates('EUR', 'JPY');

    expect(result).toHaveLength(1);
    expect(typeof result[0].rate).toBe('number');
    expect(result[0].rate).toEqual(158.123456);
  });
});
