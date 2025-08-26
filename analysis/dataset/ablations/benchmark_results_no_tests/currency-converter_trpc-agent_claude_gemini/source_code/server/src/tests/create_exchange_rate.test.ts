import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CreateExchangeRateInput } from '../schema';
import { createExchangeRate } from '../handlers/create_exchange_rate';
import { eq, gte, and } from 'drizzle-orm';

// Test input with realistic exchange rate data
const testInput: CreateExchangeRateInput = {
  from_currency: 'USD',
  to_currency: 'EUR',
  rate: 0.85234567,
  date: '2024-01-15'
};

describe('createExchangeRate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an exchange rate', async () => {
    const result = await createExchangeRate(testInput);

    // Basic field validation
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('EUR');
    expect(result.rate).toEqual(0.85234567);
    expect(result.date).toEqual('2024-01-15');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(typeof result.rate).toEqual('number');
  });

  it('should save exchange rate to database', async () => {
    const result = await createExchangeRate(testInput);

    // Query using proper drizzle syntax
    const exchangeRates = await db.select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.id, result.id))
      .execute();

    expect(exchangeRates).toHaveLength(1);
    expect(exchangeRates[0].from_currency).toEqual('USD');
    expect(exchangeRates[0].to_currency).toEqual('EUR');
    expect(parseFloat(exchangeRates[0].rate)).toEqual(0.85234567);
    expect(exchangeRates[0].date).toEqual('2024-01-15');
    expect(exchangeRates[0].created_at).toBeInstanceOf(Date);
    expect(exchangeRates[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle high precision exchange rates', async () => {
    const highPrecisionInput: CreateExchangeRateInput = {
      from_currency: 'JPY',
      to_currency: 'USD',
      rate: 0.00673821,
      date: '2024-01-15'
    };

    const result = await createExchangeRate(highPrecisionInput);

    expect(result.rate).toEqual(0.00673821);
    expect(typeof result.rate).toEqual('number');
    
    // Verify precision is maintained in database
    const exchangeRates = await db.select()
      .from(exchangeRatesTable)
      .where(eq(exchangeRatesTable.id, result.id))
      .execute();

    expect(parseFloat(exchangeRates[0].rate)).toEqual(0.00673821);
  });

  it('should create multiple exchange rates with different currency pairs', async () => {
    const usdToEur = await createExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: '2024-01-15'
    });

    const eurToGbp = await createExchangeRate({
      from_currency: 'EUR',
      to_currency: 'GBP',
      rate: 0.87,
      date: '2024-01-15'
    });

    // Verify both records exist
    const allRates = await db.select()
      .from(exchangeRatesTable)
      .execute();

    expect(allRates).toHaveLength(2);
    
    const rates = allRates.map(rate => ({
      from: rate.from_currency,
      to: rate.to_currency,
      rate: parseFloat(rate.rate)
    }));

    expect(rates).toContainEqual({ from: 'USD', to: 'EUR', rate: 0.85 });
    expect(rates).toContainEqual({ from: 'EUR', to: 'GBP', rate: 0.87 });
  });

  it('should query exchange rates by date correctly', async () => {
    // Create exchange rates for different dates
    await createExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: '2024-01-15'
    });

    await createExchangeRate({
      from_currency: 'USD',
      to_currency: 'GBP',
      rate: 0.78,
      date: '2024-01-16'
    });

    // Test date filtering
    const today = new Date();
    
    // Query for rates created today or later
    const recentRates = await db.select()
      .from(exchangeRatesTable)
      .where(gte(exchangeRatesTable.created_at, today))
      .execute();

    expect(recentRates.length).toEqual(2);
    recentRates.forEach(rate => {
      expect(rate.created_at).toBeInstanceOf(Date);
      expect(rate.created_at >= today).toBe(true);
    });
  });

  it('should handle same currency pair with different dates', async () => {
    const rate1 = await createExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.85,
      date: '2024-01-15'
    });

    const rate2 = await createExchangeRate({
      from_currency: 'USD',
      to_currency: 'EUR',
      rate: 0.86,
      date: '2024-01-16'
    });

    // Both should be created successfully
    expect(rate1.id).not.toEqual(rate2.id);
    expect(rate1.rate).toEqual(0.85);
    expect(rate2.rate).toEqual(0.86);
    expect(rate1.date).toEqual('2024-01-15');
    expect(rate2.date).toEqual('2024-01-16');

    // Verify both exist in database
    const usdEurRates = await db.select()
      .from(exchangeRatesTable)
      .where(
        and(
          eq(exchangeRatesTable.from_currency, 'USD'),
          eq(exchangeRatesTable.to_currency, 'EUR')
        )
      )
      .execute();

    expect(usdEurRates).toHaveLength(2);
  });
});
