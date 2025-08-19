import { afterEach, beforeEach, describe, expect, it, spyOn, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getCurrencies } from '../handlers/get_currencies';

describe('getCurrencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch and return currencies from Frankfurter API', async () => {
    // Mock successful API response
    const mockResponse = {
      'AUD': 'Australian Dollar',
      'BGN': 'Bulgarian Lev',
      'BRL': 'Brazilian Real',
      'CAD': 'Canadian Dollar',
      'CHF': 'Swiss Franc',
      'CNY': 'Chinese Yuan',
      'CZK': 'Czech Republic Koruna',
      'DKK': 'Danish Krone',
      'EUR': 'Euro',
      'GBP': 'British Pound Sterling',
      'HKD': 'Hong Kong Dollar',
      'HRK': 'Croatian Kuna',
      'HUF': 'Hungarian Forint',
      'IDR': 'Indonesian Rupiah',
      'ILS': 'Israeli New Sheqel',
      'INR': 'Indian Rupee',
      'ISK': 'Icelandic Króna',
      'JPY': 'Japanese Yen',
      'KRW': 'South Korean Won',
      'MXN': 'Mexican Peso',
      'MYR': 'Malaysian Ringgit',
      'NOK': 'Norwegian Krone',
      'NZD': 'New Zealand Dollar',
      'PHP': 'Philippine Peso',
      'PLN': 'Polish Zloty',
      'RON': 'Romanian Leu',
      'RUB': 'Russian Ruble',
      'SEK': 'Swedish Krona',
      'SGD': 'Singapore Dollar',
      'THB': 'Thai Baht',
      'TRY': 'Turkish Lira',
      'USD': 'US Dollar',
      'ZAR': 'South African Rand'
    };

    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await getCurrencies();

    // Verify API was called
    expect(fetchSpy).toHaveBeenCalledWith('https://api.frankfurter.app/currencies');

    // Verify result structure
    expect(result).toBeArray();
    expect(result.length).toBeGreaterThan(0);

    // Check first few currencies (sorted alphabetically)
    expect(result[0]).toEqual({ code: 'AUD', name: 'Australian Dollar' });
    expect(result[1]).toEqual({ code: 'BGN', name: 'Bulgarian Lev' });

    // Verify all currencies have required fields
    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(currency.code.length).toBe(3);
    });

    // Verify currencies are sorted by code
    const codes = result.map(c => c.code);
    const sortedCodes = [...codes].sort();
    expect(codes).toEqual(sortedCodes);

    fetchSpy.mockRestore();
  });

  it('should handle API error responses', async () => {
    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response('Not Found', { status: 404, statusText: 'Not Found' })
    );

    await expect(getCurrencies()).rejects.toThrow(/Failed to fetch currencies: 404/);

    fetchSpy.mockRestore();
  });

  it('should handle network errors', async () => {
    const fetchSpy = spyOn(global, 'fetch').mockRejectedValue(
      new Error('Network error')
    );

    await expect(getCurrencies()).rejects.toThrow(/Network error/);

    fetchSpy.mockRestore();
  });

  it('should handle malformed JSON response', async () => {
    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response('invalid json', {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(getCurrencies()).rejects.toThrow();

    fetchSpy.mockRestore();
  });

  it('should handle invalid response format', async () => {
    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(['invalid', 'format']), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    await expect(getCurrencies()).rejects.toThrow();

    fetchSpy.mockRestore();
  });

  it('should handle empty response', async () => {
    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await getCurrencies();

    expect(result).toBeArray();
    expect(result).toHaveLength(0);

    fetchSpy.mockRestore();
  });

  it('should handle single currency response correctly', async () => {
    const mockResponse = {
      'USD': 'US Dollar'
    };

    const fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const result = await getCurrencies();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ code: 'USD', name: 'US Dollar' });

    fetchSpy.mockRestore();
  });
});
