import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { type ConvertCurrencyInput, type Currency } from '../schema';
import { convertCurrency, getCurrencies, getConversionHistory } from '../handlers';

// Test input for currency conversion
const testConversionInput: ConvertCurrencyInput = {
  amount: 100,
  from: 'USD',
  to: 'EUR'
};

describe('Currency Operations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('convertCurrency', () => {
    it('should convert currency', async () => {
      const result = await convertCurrency(testConversionInput);

      // Basic field validation
      expect(result.amount).toEqual(100);
      expect(result.from).toEqual('USD');
      expect(result.to).toEqual('EUR');
      expect(typeof result.rate).toBe('number');
      expect(typeof result.convertedAmount).toBe('number');
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should handle different currency conversions', async () => {
      const input: ConvertCurrencyInput = {
        amount: 50,
        from: 'GBP',
        to: 'JPY'
      };

      const result = await convertCurrency(input);

      expect(result.amount).toEqual(50);
      expect(result.from).toEqual('GBP');
      expect(result.to).toEqual('JPY');
      expect(typeof result.rate).toBe('number');
      expect(typeof result.convertedAmount).toBe('number');
    });
  });

  describe('getCurrencies', () => {
    it('should fetch available currencies', async () => {
      const result = await getCurrencies();

      // Check that result is an array of currencies
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      // Check the structure of the first currency
      const firstCurrency = result[0];
      expect(firstCurrency).toHaveProperty('code');
      expect(firstCurrency).toHaveProperty('name');
      expect(typeof firstCurrency.code).toBe('string');
      expect(typeof firstCurrency.name).toBe('string');
    });
  });

  describe('getConversionHistory', () => {
    it('should return empty array when no conversion history exists', async () => {
      const result = await getConversionHistory();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });

    it('should return conversion history array', async () => {
      const result = await getConversionHistory();
      
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
