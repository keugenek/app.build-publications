import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CurrencyConversionRequest } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq, and } from 'drizzle-orm';

// Mock fetch globally
const mockFetch = mock();
global.fetch = mockFetch as any;

// Test input
const testInput: CurrencyConversionRequest = {
  amount: 100,
  from: 'USD',
  to: 'EUR'
};

describe('convertCurrency', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should convert currency using API when no cached rate exists', async () => {
    // Mock API response
    const mockApiResponse = {
      amount: 1,
      base: 'USD',
      date: '2024-01-15',
      rates: {
        EUR: 0.85
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await convertCurrency(testInput);

    // Verify the response
    expect(result.amount).toEqual(100);
    expect(result.from).toEqual('USD');
    expect(result.to).toEqual('EUR');
    expect(result.result).toEqual(85); // 100 * 0.85
    expect(result.rate).toEqual(0.85);
    expect(result.date).toEqual(new Date().toISOString().split('T')[0]);
    expect(result.converted_at).toBeInstanceOf(Date);

    // Verify API was called
    expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.app/latest?from=USD&to=EUR');

    // Verify rate was cached in database
    const cachedRates = await db.select()
      .from(exchangeRatesTable)
      .where(and(
        eq(exchangeRatesTable.from_currency, 'USD'),
        eq(exchangeRatesTable.to_currency, 'EUR')
      ))
      .execute();

    expect(cachedRates).toHaveLength(1);
    expect(parseFloat(cachedRates[0].rate)).toEqual(0.85);
    expect(cachedRates[0].date).toEqual('2024-01-15');
  });

  it('should use cached rate when available for today', async () => {
    const todayDate = new Date().toISOString().split('T')[0];

    // Insert cached rate
    await db.insert(exchangeRatesTable)
      .values({
        from_currency: 'USD',
        to_currency: 'EUR',
        rate: '0.90',
        date: todayDate,
        updated_at: new Date()
      })
      .execute();

    const result = await convertCurrency(testInput);

    // Verify the response uses cached rate
    expect(result.amount).toEqual(100);
    expect(result.from).toEqual('USD');
    expect(result.to).toEqual('EUR');
    expect(result.result).toEqual(90); // 100 * 0.90
    expect(result.rate).toEqual(0.90);
    expect(result.date).toEqual(todayDate);

    // Verify API was NOT called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle different currency pairs correctly', async () => {
    const gbpInput: CurrencyConversionRequest = {
      amount: 50,
      from: 'GBP',
      to: 'JPY'
    };

    // Mock API response for GBP to JPY
    const mockApiResponse = {
      amount: 1,
      base: 'GBP',
      date: '2024-01-15',
      rates: {
        JPY: 150.25
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await convertCurrency(gbpInput);

    expect(result.amount).toEqual(50);
    expect(result.from).toEqual('GBP');
    expect(result.to).toEqual('JPY');
    expect(result.result).toEqual(7512.5); // 50 * 150.25
    expect(result.rate).toEqual(150.25);
  });

  it('should handle API failures gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Internal Server Error'
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(/Failed to fetch exchange rate/i);
  });

  it('should handle missing exchange rate in API response', async () => {
    // Mock API response without the requested currency
    const mockApiResponse = {
      amount: 1,
      base: 'USD',
      date: '2024-01-15',
      rates: {
        GBP: 0.75 // Missing EUR
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(/Exchange rate not available for USD to EUR/i);
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CurrencyConversionRequest = {
      amount: 123.45,
      from: 'USD',
      to: 'EUR'
    };

    const mockApiResponse = {
      amount: 1,
      base: 'USD',
      date: '2024-01-15',
      rates: {
        EUR: 0.85
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await convertCurrency(decimalInput);

    expect(result.amount).toEqual(123.45);
    expect(result.result).toEqual(104.9325); // 123.45 * 0.85
  });

  it('should store rates with proper numeric precision', async () => {
    const highPrecisionRate = 1.23456789;
    
    const mockApiResponse = {
      amount: 1,
      base: 'USD',
      date: '2024-01-15',
      rates: {
        EUR: highPrecisionRate
      }
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    await convertCurrency(testInput);

    // Verify high precision rate was stored correctly
    const cachedRates = await db.select()
      .from(exchangeRatesTable)
      .where(and(
        eq(exchangeRatesTable.from_currency, 'USD'),
        eq(exchangeRatesTable.to_currency, 'EUR')
      ))
      .execute();

    expect(cachedRates).toHaveLength(1);
    expect(parseFloat(cachedRates[0].rate)).toEqual(highPrecisionRate);
  });
});
