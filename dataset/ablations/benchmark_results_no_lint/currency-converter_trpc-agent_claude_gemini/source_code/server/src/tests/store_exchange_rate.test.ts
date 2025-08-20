import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CreateExchangeRateInput } from '../schema';
import { storeExchangeRate } from '../handlers/store_exchange_rate';
import { eq, and } from 'drizzle-orm';

// Test input for USD to EUR exchange rate
const testInput: CreateExchangeRateInput = {
  from_currency: 'USD',
  to_currency: 'EUR',
  rate: 0.85432109,
  date: new Date('2024-01-15')
};

describe('storeExchangeRate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should store an exchange rate', async () => {
    const result = await storeExchangeRate(testInput);

    // Basic field validation
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('EUR');
    expect(result.rate).toEqual(0.85432109);
    expect(result.date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify rate is returned as number
    expect(typeof result.rate).toBe('number');
  });

  it('should save exchange rate to database', async () => {
    const result = await storeExchangeRate(testInput);

    // Query the database to verify storage
    const exchangeRates = await db.select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.id, result.id))
      .execute();

    expect(exchangeRates).toHaveLength(1);
    const storedRate = exchangeRates[0];
    expect(storedRate.from_currency).toEqual('USD');
    expect(storedRate.to_currency).toEqual('EUR');
    expect(parseFloat(storedRate.rate)).toEqual(0.85432109);
    expect(new Date(storedRate.date)).toEqual(new Date('2024-01-15'));
    expect(storedRate.created_at).toBeInstanceOf(Date);
  });

  it('should handle high precision rates correctly', async () => {
    const highPrecisionInput: CreateExchangeRateInput = {
      from_currency: 'JPY',
      to_currency: 'USD',
      rate: 0.00678234567, // Very small rate with high precision
      date: new Date('2024-01-20')
    };

    const result = await storeExchangeRate(highPrecisionInput);

    // Verify precision is maintained
    expect(result.rate).toBeCloseTo(0.00678234567, 8);
    expect(typeof result.rate).toBe('number');

    // Verify it's stored correctly in database
    const stored = await db.select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.id, result.id))
      .execute();

    expect(parseFloat(stored[0].rate)).toBeCloseTo(0.00678234567, 8);
    expect(new Date(stored[0].date)).toEqual(new Date('2024-01-20'));
  });

  it('should store multiple exchange rates', async () => {
    const inputs: CreateExchangeRateInput[] = [
      {
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: 0.85,
        date: new Date('2024-01-15')
      },
      {
        from_currency: 'EUR',
        to_currency: 'GBP',
        rate: 0.87,
        date: new Date('2024-01-15')
      },
      {
        from_currency: 'GBP',
        to_currency: 'CHF',
        rate: 1.12,
        date: new Date('2024-01-16')
      }
    ];

    // Store all rates
    const results = await Promise.all(
      inputs.map(input => storeExchangeRate(input))
    );

    expect(results).toHaveLength(3);

    // Verify all rates are stored with unique IDs
    const ids = results.map(r => r.id);
    expect(new Set(ids)).toHaveProperty('size', 3); // All unique IDs

    // Verify database contains all records
    const allRates = await db.select()
      .from(exchangeRatesTable)
      .execute();

    expect(allRates).toHaveLength(3);
  });

  it('should handle same currency pair for different dates', async () => {
    const rate1: CreateExchangeRateInput = {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: new Date('2024-01-15')
    };

    const rate2: CreateExchangeRateInput = {
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.86,
      date: new Date('2024-01-16')
    };

    const result1 = await storeExchangeRate(rate1);
    const result2 = await storeExchangeRate(rate2);

    // Both should be stored successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.rate).toEqual(0.85);
    expect(result2.rate).toEqual(0.86);

    // Verify both are in database
    const rates = await db.select()
      .from(exchangeRatesTable)
      .where(
        and(
          eq(exchangeRatesTable.from_currency, 'USD'),
          eq(exchangeRatesTable.to_currency, 'EUR')
        )
      )
      .execute();

    expect(rates).toHaveLength(2);
  });

  it('should preserve date accuracy', async () => {
    const specificDate = new Date('2024-03-15T00:00:00.000Z');
    const input: CreateExchangeRateInput = {
      from_currency: 'CAD',
      to_currency: 'AUD',
      rate: 1.0875,
      date: specificDate
    };

    const result = await storeExchangeRate(input);

    expect(result.date).toEqual(specificDate);

    // Verify in database
    const stored = await db.select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.id, result.id))
      .execute();

    expect(new Date(stored[0].date)).toEqual(specificDate);
  });
});
