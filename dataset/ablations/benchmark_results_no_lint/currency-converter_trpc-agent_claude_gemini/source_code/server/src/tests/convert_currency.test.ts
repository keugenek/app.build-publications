import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { exchangeRatesTable } from '../db/schema';
import { type CurrencyConversionRequest } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq, and } from 'drizzle-orm';

// Mock fetch for testing
const mockFetch = mock(() => Promise.resolve(new Response()));

// Test input for USD to EUR conversion
const testInput: CurrencyConversionRequest = {
  amount: 100,
  from_currency: 'USD',
  to_currency: 'EUR'
};

// Mock API response
const mockApiResponse = {
  amount: 100,
  base: 'USD',
  date: '2024-01-15',
  rates: {
    EUR: 0.85
  }
};

describe('convertCurrency', () => {
  beforeEach(async () => {
    await createDB();
    (global as any).fetch = mockFetch;
    mockFetch.mockClear();
  });

  afterEach(resetDB);

  it('should convert currency successfully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        statusText: 'OK'
      })
    );

    const result = await convertCurrency(testInput);

    expect(result.original_amount).toEqual(100);
    expect(result.converted_amount).toEqual(85); // 100 * 0.85
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('EUR');
    expect(result.exchange_rate).toEqual(0.85);
    expect(result.conversion_date).toBeInstanceOf(Date);
    expect(result.conversion_date.toISOString().split('T')[0]).toEqual('2024-01-15');
  });

  it('should handle same currency conversion', async () => {
    const sameCurrencyInput: CurrencyConversionRequest = {
      amount: 50,
      from_currency: 'USD',
      to_currency: 'USD'
    };

    const result = await convertCurrency(sameCurrencyInput);

    expect(result.original_amount).toEqual(50);
    expect(result.converted_amount).toEqual(50);
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('USD');
    expect(result.exchange_rate).toEqual(1.0);
    expect(result.conversion_date).toBeInstanceOf(Date);

    // Should not call API for same currency
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should store exchange rate in database', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        statusText: 'OK'
      })
    );

    await convertCurrency(testInput);

    // Verify exchange rate was stored in database
    const storedRates = await db.select()
      .from(exchangeRatesTable)
      .where(and(
        eq(exchangeRatesTable.from_currency, 'USD'),
        eq(exchangeRatesTable.to_currency, 'EUR')
      ))
      .execute();

    expect(storedRates).toHaveLength(1);
    expect(storedRates[0].from_currency).toEqual('USD');
    expect(storedRates[0].to_currency).toEqual('EUR');
    expect(parseFloat(storedRates[0].rate)).toEqual(0.85); // Convert string back to number
    expect(storedRates[0].date).toEqual('2024-01-15');
    expect(storedRates[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle API errors gracefully', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response('Not Found', {
        status: 404,
        statusText: 'Not Found'
      })
    );

    await expect(convertCurrency(testInput)).rejects.toThrow(/Failed to fetch exchange rate: 404 Not Found/);
  });

  it('should handle missing exchange rate in API response', async () => {
    const mockResponseWithoutRate = {
      amount: 100,
      base: 'USD',
      date: '2024-01-15',
      rates: {} // Empty rates object
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponseWithoutRate), {
        status: 200,
        statusText: 'OK'
      })
    );

    await expect(convertCurrency(testInput)).rejects.toThrow(/Exchange rate not found for USD to EUR/);
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(convertCurrency(testInput)).rejects.toThrow('Network error');
  });

  it('should continue conversion even if database storage fails', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        statusText: 'OK'
      })
    );

    // Mock console.error to verify it's called
    const consoleSpy = mock(() => {});
    console.error = consoleSpy;

    // Close database connection to simulate database error
    await db.execute('DROP TABLE IF EXISTS exchange_rates CASCADE');

    const result = await convertCurrency(testInput);

    // Conversion should still succeed
    expect(result.original_amount).toEqual(100);
    expect(result.converted_amount).toEqual(85);
    expect(result.exchange_rate).toEqual(0.85);

    // Should log database error
    expect(consoleSpy).toHaveBeenCalledWith('Failed to store exchange rate in database:', expect.any(Error));
  });

  it('should handle different currency pairs', async () => {
    const gbpToJpyInput: CurrencyConversionRequest = {
      amount: 25,
      from_currency: 'GBP',
      to_currency: 'JPY'
    };

    const mockGbpJpyResponse = {
      amount: 25,
      base: 'GBP',
      date: '2024-01-15',
      rates: {
        JPY: 150.75
      }
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockGbpJpyResponse), {
        status: 200,
        statusText: 'OK'
      })
    );

    const result = await convertCurrency(gbpToJpyInput);

    expect(result.original_amount).toEqual(25);
    expect(result.converted_amount).toEqual(3768.75); // 25 * 150.75
    expect(result.from_currency).toEqual('GBP');
    expect(result.to_currency).toEqual('JPY');
    expect(result.exchange_rate).toEqual(150.75);

    // Verify API was called with correct parameters
    expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.app/latest?from=GBP&to=JPY');
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: CurrencyConversionRequest = {
      amount: 123.456,
      from_currency: 'USD',
      to_currency: 'EUR'
    };

    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        statusText: 'OK'
      })
    );

    const result = await convertCurrency(decimalInput);

    expect(result.original_amount).toEqual(123.456);
    expect(result.converted_amount).toEqual(104.9376); // 123.456 * 0.85
    expect(typeof result.converted_amount).toBe('number');
  });
});
