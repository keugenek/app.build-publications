import { describe, expect, it, spyOn } from 'bun:test';
import { convertCurrency } from '../handlers/convert_currency';
import { type ConvertCurrencyInput } from '../schema';
import axios from 'axios';

describe('convertCurrency', () => {
  const mockInput: ConvertCurrencyInput = {
    amount: 100,
    from: 'USD',
    to: 'EUR'
  };

  it('should convert currency successfully', async () => {
    // Mock axios.get to return a fixed response
    const mockResponse = {
      data: {
        amount: 100,
        base: 'USD',
        date: '2023-01-01',
        rates: {
          EUR: 0.85
        }
      }
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await convertCurrency(mockInput);

    expect(result).toBeDefined();
    expect(result.amount).toBe(100);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('EUR');
    expect(result.convertedAmount).toBe(85); // 100 * 0.85
    expect(result.exchangeRate).toBe(0.85);
    expect(result.timestamp).toBeInstanceOf(Date);
    expect(result.timestamp).toEqual(new Date('2023-01-01'));
  });

  it('should handle different currency conversions', async () => {
    const input: ConvertCurrencyInput = {
      amount: 50,
      from: 'USD',
      to: 'GBP'
    };

    const mockResponse = {
      data: {
        amount: 50,
        base: 'USD',
        date: '2023-01-01',
        rates: {
          GBP: 0.75
        }
      }
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await convertCurrency(input);

    expect(result).toBeDefined();
    expect(result.amount).toBe(50);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('GBP');
    expect(result.convertedAmount).toBe(37.5); // 50 * 0.75
    expect(result.exchangeRate).toBe(0.75);
  });

  it('should handle zero decimal currencies correctly', async () => {
    const input: ConvertCurrencyInput = {
      amount: 1,
      from: 'USD',
      to: 'JPY'
    };

    const mockResponse = {
      data: {
        amount: 1,
        base: 'USD',
        date: '2023-01-01',
        rates: {
          JPY: 110
        }
      }
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await convertCurrency(input);

    expect(result).toBeDefined();
    expect(result.amount).toBe(1);
    expect(result.from).toBe('USD');
    expect(result.to).toBe('JPY');
    expect(result.convertedAmount).toBe(110); // 1 * 110
    expect(result.exchangeRate).toBe(110);
  });

  it('should round converted amounts to 2 decimal places', async () => {
    const input: ConvertCurrencyInput = {
      amount: 10,
      from: 'USD',
      to: 'EUR'
    };

    const mockResponse = {
      data: {
        amount: 10,
        base: 'USD',
        date: '2023-01-01',
        rates: {
          EUR: 0.8333333333 // This would cause repeating decimals
        }
      }
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await convertCurrency(input);

    expect(result).toBeDefined();
    // Should be rounded to 2 decimal places
    expect(result.convertedAmount).toBe(8.33); // 10 * 0.8333333333 = 8.333333333, rounded to 8.33
  });

  it('should round exchange rates to 6 decimal places', async () => {
    const input: ConvertCurrencyInput = {
      amount: 1,
      from: 'USD',
      to: 'EUR'
    };

    const mockResponse = {
      data: {
        amount: 1,
        base: 'USD',
        date: '2023-01-01',
        rates: {
          EUR: 0.833333333333333 // Many decimals
        }
      }
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockResolvedValue(mockResponse);

    const result = await convertCurrency(input);

    expect(result).toBeDefined();
    // Should be rounded to 6 decimal places
    expect(result.exchangeRate).toBe(0.833333); // Rounded from 0.833333333333333
  });

  it('should throw an error when API request fails', async () => {
    const input: ConvertCurrencyInput = {
      amount: 100,
      from: 'USD',
      to: 'EUR'
    };

    // @ts-ignore - Bun test spy typing workaround
    spyOn(axios, 'get').mockRejectedValue(new Error('Network error'));

    await expect(convertCurrency(input)).rejects.toThrow(/Failed to convert currency/);
  });
});
