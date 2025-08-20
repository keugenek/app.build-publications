import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { currencyConversionsTable } from '../db/schema';
import { type CurrencyConversionInput } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq } from 'drizzle-orm';

// Mock the global fetch function
const mockFetch = mock();
(global as any).fetch = mockFetch;

// Test input
const testInput: CurrencyConversionInput = {
  amount: 100.50,
  from_currency: 'USD',
  to_currency: 'EUR'
};

// Mock API response
const mockApiResponse = {
  amount: 100.5,
  base: 'USD',
  date: '2024-01-15',
  rates: {
    EUR: 0.85
  }
};

describe('convertCurrency', () => {
  beforeEach(async () => {
    await createDB();
    mockFetch.mockClear();
  });

  afterEach(resetDB);

  it('should convert currency successfully', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await convertCurrency(testInput);

    // Verify conversion calculation
    expect(result.amount).toEqual(100.50);
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('EUR');
    expect(result.exchange_rate).toEqual(0.85);
    expect(result.converted_amount).toEqual(85.425); // 100.50 * 0.85
    expect(result.conversion_date).toEqual(new Date('2024-01-15'));
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify correct API call
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.app/latest?from=USD&to=EUR'
    );
  });

  it('should save conversion to database', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockApiResponse)
    });

    const result = await convertCurrency(testInput);

    // Query database to verify record was saved
    const conversions = await db.select()
      .from(currencyConversionsTable)
      .where(eq(currencyConversionsTable.id, result.id))
      .execute();

    expect(conversions).toHaveLength(1);
    const savedConversion = conversions[0];
    
    expect(parseFloat(savedConversion.amount)).toEqual(100.50);
    expect(savedConversion.from_currency).toEqual('USD');
    expect(savedConversion.to_currency).toEqual('EUR');
    expect(parseFloat(savedConversion.exchange_rate)).toEqual(0.85);
    expect(parseFloat(savedConversion.converted_amount)).toEqual(85.425);
    expect(savedConversion.conversion_date).toEqual('2024-01-15');
    expect(savedConversion.created_at).toBeInstanceOf(Date);
  });

  it('should handle different currency pairs', async () => {
    const gbpInput: CurrencyConversionInput = {
      amount: 50.25,
      from_currency: 'GBP',
      to_currency: 'JPY'
    };

    const gbpApiResponse = {
      amount: 50.25,
      base: 'GBP',
      date: '2024-01-15',
      rates: {
        JPY: 150.75
      }
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(gbpApiResponse)
    });

    const result = await convertCurrency(gbpInput);

    expect(result.amount).toEqual(50.25);
    expect(result.from_currency).toEqual('GBP');
    expect(result.to_currency).toEqual('JPY');
    expect(result.exchange_rate).toEqual(150.75);
    expect(result.converted_amount).toEqual(7575.1875); // 50.25 * 150.75

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.app/latest?from=GBP&to=JPY'
    );
  });

  it('should handle small amounts with precision', async () => {
    const smallAmountInput: CurrencyConversionInput = {
      amount: 0.01,
      from_currency: 'USD',
      to_currency: 'EUR'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...mockApiResponse,
        amount: 0.01
      })
    });

    const result = await convertCurrency(smallAmountInput);

    expect(result.amount).toEqual(0.01);
    expect(result.converted_amount).toEqual(0.0085); // 0.01 * 0.85
    expect(typeof result.amount).toBe('number');
    expect(typeof result.converted_amount).toBe('number');
    expect(typeof result.exchange_rate).toBe('number');
  });

  it('should handle large amounts correctly', async () => {
    const largeAmountInput: CurrencyConversionInput = {
      amount: 1000000.99,
      from_currency: 'USD',
      to_currency: 'EUR'
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        ...mockApiResponse,
        amount: 1000000.99
      })
    });

    const result = await convertCurrency(largeAmountInput);

    expect(result.amount).toEqual(1000000.99);
    expect(result.converted_amount).toEqual(850000.8415); // 1000000.99 * 0.85
    expect(typeof result.amount).toBe('number');
    expect(typeof result.converted_amount).toBe('number');
  });

  it('should throw error when API request fails', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(
      /Failed to fetch exchange rate: 404 Not Found/i
    );
  });

  it('should throw error when API returns invalid data', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        date: '2024-01-15',
        base: 'USD',
        rates: {} // Empty rates object
      })
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(
      /Invalid exchange rate data received for USD to EUR/i
    );
  });

  it('should throw error when API returns malformed response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        date: '2024-01-15',
        base: 'USD'
        // Missing rates property
      })
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(
      /Invalid exchange rate data received for USD to EUR/i
    );
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(convertCurrency(testInput)).rejects.toThrow(/Network error/i);
  });
});
