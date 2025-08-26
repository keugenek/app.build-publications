import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionHistoryTable, currenciesTable } from '../db/schema';
import { type ConvertCurrencyInput } from '../schema';
import { convertCurrency } from '../handlers/convert_currency';
import { eq } from 'drizzle-orm';

// Mock the global fetch API
const mockFetch = (url: string) => {
  const fromMatch = url.match(/from=([A-Z]{3})/);
  const toMatch = url.match(/to=([A-Z]{3})/);
  
  if (!fromMatch || !toMatch) {
    return Promise.resolve({
      ok: false,
      statusText: 'Invalid request'
    });
  }
  
  const fromCurrency = fromMatch[1];
  const toCurrency = toMatch[1];
  
  // Mock exchange rates
  const exchangeRates: Record<string, Record<string, number>> = {
    'EUR': {
      'USD': 1.2,
      'GBP': 0.85
    },
    'USD': {
      'EUR': 0.83,
      'GBP': 0.71
    }
  };
  
  if (exchangeRates[fromCurrency] && exchangeRates[fromCurrency][toCurrency]) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        date: '2023-01-01',
        rates: {
          [toCurrency]: exchangeRates[fromCurrency][toCurrency]
        }
      })
    });
  }
  
  return Promise.resolve({
    ok: false,
    statusText: 'Not Found'
  });
};

// Apply the mock
global.fetch = mockFetch as any;

// Test input
const testInput: ConvertCurrencyInput = {
  amount: 100,
  fromCurrency: 'EUR',
  toCurrency: 'USD'
};

describe('convertCurrency', () => {
  beforeEach(async () => {
    await createDB();
    // Insert test currencies
    await db.insert(currenciesTable).values([
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'GBP', name: 'British Pound', symbol: '£' }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should convert currency and return correct result', async () => {
    const result = await convertCurrency(testInput);

    // Basic field validation
    expect(result.amount).toEqual(100);
    expect(result.fromCurrency).toEqual('EUR');
    expect(result.toCurrency).toEqual('USD');
    expect(result.convertedAmount).toEqual(120); // 100 * 1.2
    expect(result.exchangeRate).toEqual(1.2);
    expect(result.timestamp).toBeInstanceOf(Date);
  });

  it('should save conversion to database', async () => {
    await convertCurrency(testInput);

    // Query using proper drizzle syntax
    const history = await db.select()
      .from(conversionHistoryTable)
      .orderBy(conversionHistoryTable.id)
      .execute();

    expect(history).toHaveLength(1);
    expect(parseFloat(history[0].amount)).toEqual(100);
    expect(history[0].fromCurrency).toEqual('EUR');
    expect(history[0].toCurrency).toEqual('USD');
    expect(parseFloat(history[0].convertedAmount)).toEqual(120);
    expect(parseFloat(history[0].exchangeRate)).toEqual(1.2);
    expect(history[0].timestamp).toBeInstanceOf(Date);
  });

  it('should handle different currency pairs', async () => {
    const gbpInput: ConvertCurrencyInput = {
      amount: 50,
      fromCurrency: 'USD',
      toCurrency: 'GBP'
    };

    const result = await convertCurrency(gbpInput);

    expect(result.amount).toEqual(50);
    expect(result.fromCurrency).toEqual('USD');
    expect(result.toCurrency).toEqual('GBP');
    expect(result.convertedAmount).toBeCloseTo(35.5); // 50 * 0.71
    expect(result.exchangeRate).toEqual(0.71);
  });

  it('should throw error for unsupported currency pair', async () => {
    const invalidInput: ConvertCurrencyInput = {
      amount: 100,
      fromCurrency: 'EUR',
      toCurrency: 'XYZ' // Unsupported currency
    };

    await expect(convertCurrency(invalidInput)).rejects.toThrow();
  });
});
