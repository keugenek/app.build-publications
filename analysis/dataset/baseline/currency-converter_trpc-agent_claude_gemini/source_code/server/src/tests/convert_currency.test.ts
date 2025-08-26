import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { type ConversionRequest } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq } from 'drizzle-orm';

// Mock the global fetch function
const mockFetch = mock();
(global as any).fetch = mockFetch;

const testInput: ConversionRequest = {
  amount: 100,
  from_currency: 'USD',
  to_currency: 'EUR',
};

const mockApiResponse = {
  amount: 1,
  base: 'USD',
  date: '2024-01-15',
  rates: {
    EUR: 0.85,
  },
};

describe('convertCurrency', () => {
  beforeEach(async () => {
    await createDB();
    mockFetch.mockClear();
  });

  afterEach(resetDB);

  it('should convert currency using external API', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await convertCurrency(testInput);

    // Verify result structure and calculations
    expect(result.amount).toEqual(100);
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('EUR');
    expect(result.exchange_rate).toEqual(0.85);
    expect(result.converted_amount).toEqual(85); // 100 * 0.85
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify API was called correctly
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.app/latest?from=USD&to=EUR'
    );
  });

  it('should save conversion to database', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    });

    const result = await convertCurrency(testInput);

    // Query database to verify record was saved
    const conversions = await db.select()
      .from(conversionsTable)
      .where(eq(conversionsTable.id, result.id))
      .execute();

    expect(conversions).toHaveLength(1);
    const conversion = conversions[0];
    expect(parseFloat(conversion.amount)).toEqual(100);
    expect(conversion.from_currency).toEqual('USD');
    expect(conversion.to_currency).toEqual('EUR');
    expect(parseFloat(conversion.exchange_rate)).toEqual(0.85);
    expect(parseFloat(conversion.converted_amount)).toEqual(85);
    expect(conversion.created_at).toBeInstanceOf(Date);
  });

  it('should handle same currency conversion', async () => {
    const sameInput: ConversionRequest = {
      amount: 150,
      from_currency: 'USD',
      to_currency: 'USD',
    };

    const result = await convertCurrency(sameInput);

    // Verify same currency conversion
    expect(result.amount).toEqual(150);
    expect(result.from_currency).toEqual('USD');
    expect(result.to_currency).toEqual('USD');
    expect(result.exchange_rate).toEqual(1);
    expect(result.converted_amount).toEqual(150);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify API was not called for same currency
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should handle API error responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(/Exchange rate API error: 404 Not Found/i);
  });

  it('should handle missing exchange rate in API response', async () => {
    const incompleteResponse = {
      ...mockApiResponse,
      rates: {}, // No EUR rate
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => incompleteResponse,
    });

    await expect(convertCurrency(testInput)).rejects.toThrow(/Exchange rate not found for currency pair USD\/EUR/i);
  });

  it('should handle network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(convertCurrency(testInput)).rejects.toThrow(/Network error/i);
  });

  it('should handle different currency pairs correctly', async () => {
    const gbpInput: ConversionRequest = {
      amount: 50,
      from_currency: 'GBP',
      to_currency: 'USD',
    };

    const gbpResponse = {
      amount: 1,
      base: 'GBP',
      date: '2024-01-15',
      rates: {
        USD: 1.25,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => gbpResponse,
    });

    const result = await convertCurrency(gbpInput);

    expect(result.amount).toEqual(50);
    expect(result.from_currency).toEqual('GBP');
    expect(result.to_currency).toEqual('USD');
    expect(result.exchange_rate).toEqual(1.25);
    expect(result.converted_amount).toEqual(62.5); // 50 * 1.25
    expect(result.id).toBeDefined();

    // Verify correct API endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.frankfurter.app/latest?from=GBP&to=USD'
    );
  });

  it('should handle decimal amounts correctly', async () => {
    const decimalInput: ConversionRequest = {
      amount: 123.45,
      from_currency: 'EUR',
      to_currency: 'JPY',
    };

    const jpyResponse = {
      amount: 1,
      base: 'EUR',
      date: '2024-01-15',
      rates: {
        JPY: 130.5,
      },
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => jpyResponse,
    });

    const result = await convertCurrency(decimalInput);

    expect(result.amount).toEqual(123.45);
    expect(result.from_currency).toEqual('EUR');
    expect(result.to_currency).toEqual('JPY');
    expect(result.exchange_rate).toEqual(130.5);
    expect(result.converted_amount).toBeCloseTo(16110.225); // 123.45 * 130.5
    expect(result.id).toBeDefined();
  });
});
