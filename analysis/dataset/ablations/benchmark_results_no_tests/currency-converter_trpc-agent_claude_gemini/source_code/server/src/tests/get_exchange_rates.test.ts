import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { getExchangeRates } from '../handlers/get_exchange_rates';

describe('getExchangeRates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no exchange rates exist', async () => {
    const result = await getExchangeRates();

    expect(result).toEqual([]);
  });

  it('should return all exchange rates from database', async () => {
    // Insert test exchange rates
    await db.insert(exchangeRatesTable).values([
      {
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: '0.85123456',
        date: '2024-01-15'
      },
      {
        from_currency: 'EUR',
        to_currency: 'GBP',
        rate: '0.86789012',
        date: '2024-01-15'
      },
      {
        from_currency: 'GBP',
        to_currency: 'JPY',
        rate: '188.45678901',
        date: '2024-01-16'
      }
    ]).execute();

    const result = await getExchangeRates();

    expect(result).toHaveLength(3);

    // Verify first exchange rate
    const usdEurRate = result.find(r => r.from_currency === 'USD' && r.to_currency === 'EUR');
    expect(usdEurRate).toBeDefined();
    expect(usdEurRate!.rate).toEqual(0.85123456);
    expect(typeof usdEurRate!.rate).toBe('number');
    expect(usdEurRate!.date).toEqual('2024-01-15');
    expect(usdEurRate!.id).toBeDefined();
    expect(usdEurRate!.created_at).toBeInstanceOf(Date);
    expect(usdEurRate!.updated_at).toBeInstanceOf(Date);

    // Verify second exchange rate
    const eurGbpRate = result.find(r => r.from_currency === 'EUR' && r.to_currency === 'GBP');
    expect(eurGbpRate).toBeDefined();
    expect(eurGbpRate!.rate).toEqual(0.86789012);
    expect(typeof eurGbpRate!.rate).toBe('number');
    expect(eurGbpRate!.date).toEqual('2024-01-15');

    // Verify third exchange rate with higher precision
    const gbpJpyRate = result.find(r => r.from_currency === 'GBP' && r.to_currency === 'JPY');
    expect(gbpJpyRate).toBeDefined();
    expect(gbpJpyRate!.rate).toEqual(188.45678901);
    expect(typeof gbpJpyRate!.rate).toBe('number');
    expect(gbpJpyRate!.date).toEqual('2024-01-16');
  });

  it('should handle high precision numeric rates correctly', async () => {
    // Test with very high precision rate
    await db.insert(exchangeRatesTable).values({
      from_currency: 'BTC',
      to_currency: 'USD',
      rate: '45123.87654321',
      date: '2024-01-15'
    }).execute();

    const result = await getExchangeRates();

    expect(result).toHaveLength(1);
    expect(result[0].rate).toEqual(45123.87654321);
    expect(typeof result[0].rate).toBe('number');
    expect(result[0].from_currency).toEqual('BTC');
    expect(result[0].to_currency).toEqual('USD');
  });

  it('should return rates in insertion order', async () => {
    const testRates = [
      {
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: '0.85000000',
        date: '2024-01-15'
      },
      {
        from_currency: 'EUR',
        to_currency: 'USD',
        rate: '1.17647059',
        date: '2024-01-15'
      },
      {
        from_currency: 'USD',
        to_currency: 'GBP',
        rate: '0.78000000',
        date: '2024-01-16'
      }
    ];

    // Insert rates one by one to ensure order
    for (const rate of testRates) {
      await db.insert(exchangeRatesTable).values(rate).execute();
    }

    const result = await getExchangeRates();

    expect(result).toHaveLength(3);
    
    // Verify they're returned in the correct order (by id)
    expect(result[0].from_currency).toEqual('USD');
    expect(result[0].to_currency).toEqual('EUR');
    expect(result[1].from_currency).toEqual('EUR');
    expect(result[1].to_currency).toEqual('USD');
    expect(result[2].from_currency).toEqual('USD');
    expect(result[2].to_currency).toEqual('GBP');

    // Verify IDs are sequential
    expect(result[1].id).toBeGreaterThan(result[0].id);
    expect(result[2].id).toBeGreaterThan(result[1].id);
  });

  it('should handle rates with same currency pairs but different dates', async () => {
    // Insert multiple rates for the same currency pair on different dates
    await db.insert(exchangeRatesTable).values([
      {
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: '0.85000000',
        date: '2024-01-15'
      },
      {
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: '0.86000000',
        date: '2024-01-16'
      }
    ]).execute();

    const result = await getExchangeRates();

    expect(result).toHaveLength(2);

    const rate1 = result.find(r => r.date === '2024-01-15');
    const rate2 = result.find(r => r.date === '2024-01-16');

    expect(rate1).toBeDefined();
    expect(rate1!.rate).toEqual(0.85);
    expect(rate2).toBeDefined();
    expect(rate2!.rate).toEqual(0.86);

    // Both should have same currency pair
    expect(rate1!.from_currency).toEqual('USD');
    expect(rate1!.to_currency).toEqual('EUR');
    expect(rate2!.from_currency).toEqual('USD');
    expect(rate2!.to_currency).toEqual('EUR');
  });
});
