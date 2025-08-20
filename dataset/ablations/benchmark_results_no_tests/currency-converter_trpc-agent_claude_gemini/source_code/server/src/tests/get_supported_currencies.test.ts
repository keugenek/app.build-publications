import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getSupportedCurrencies } from '../handlers/get_supported_currencies';

describe('getSupportedCurrencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Mock the global fetch for testing
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and return supported currencies from Frankfurter API', async () => {
    // Mock successful API response
    const mockCurrencies = {
      'USD': 'US Dollar',
      'EUR': 'Euro',
      'GBP': 'British Pound Sterling',
      'JPY': 'Japanese Yen',
      'CAD': 'Canadian Dollar'
    };

    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCurrencies)
    })) as any;

    const result = await getSupportedCurrencies();

    // Verify the structure and content
    expect(result).toBeArray();
    expect(result.length).toEqual(5);
    
    // Check that all currencies have the correct structure
    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(currency.code.length).toBe(3);
    });

    // Verify specific currencies are included with our enhanced names
    const usd = result.find(c => c.code === 'USD');
    expect(usd).toBeDefined();
    expect(usd?.name).toEqual('US Dollar');

    const eur = result.find(c => c.code === 'EUR');
    expect(eur).toBeDefined();
    expect(eur?.name).toEqual('Euro');

    const gbp = result.find(c => c.code === 'GBP');
    expect(gbp).toBeDefined();
    expect(gbp?.name).toEqual('British Pound Sterling');

    // Verify fetch was called with correct URL
    expect(global.fetch).toHaveBeenCalledWith('https://api.frankfurter.app/currencies');
  });

  it('should use enhanced currency names from mapping', async () => {
    // Mock API response with limited names
    const mockCurrencies = {
      'CHF': 'Swiss Franc',
      'AUD': 'Australian Dollar'
    };

    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCurrencies)
    })) as any;

    const result = await getSupportedCurrencies();

    // Verify our enhanced names are used
    const chf = result.find(c => c.code === 'CHF');
    expect(chf?.name).toEqual('Swiss Franc');

    const aud = result.find(c => c.code === 'AUD');
    expect(aud?.name).toEqual('Australian Dollar');
  });

  it('should handle unknown currencies gracefully', async () => {
    // Mock response with a currency not in our mapping
    const mockCurrencies = {
      'XYZ': 'Test Currency'
    };

    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCurrencies)
    })) as any;

    const result = await getSupportedCurrencies();

    // Should use API-provided name as fallback
    const xyz = result.find(c => c.code === 'XYZ');
    expect(xyz?.name).toEqual('Test Currency');
  });

  it('should handle API errors', async () => {
    // Mock API error response
    global.fetch = mock(() => Promise.resolve({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    })) as any;

    // Should throw error
    expect(getSupportedCurrencies()).rejects.toThrow(/Frankfurter API error: 500 Internal Server Error/);
  });

  it('should handle network errors', async () => {
    // Mock network error
    global.fetch = mock(() => Promise.reject(new Error('Network error'))) as any;

    // Should throw error
    expect(getSupportedCurrencies()).rejects.toThrow(/Network error/);
  });

  it('should handle invalid JSON response', async () => {
    // Mock response with invalid JSON
    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.reject(new Error('Invalid JSON'))
    })) as any;

    // Should throw error
    expect(getSupportedCurrencies()).rejects.toThrow(/Invalid JSON/);
  });

  it('should return currencies in consistent format', async () => {
    // Mock response with various currency formats
    const mockCurrencies = {
      'USD': 'United States Dollar',
      'EUR': 'Euro',
      'JPY': 'Japanese Yen'
    };

    global.fetch = mock(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve(mockCurrencies)
    })) as any;

    const result = await getSupportedCurrencies();

    // All currencies should have 3-character codes
    result.forEach(currency => {
      expect(currency.code).toMatch(/^[A-Z]{3}$/);
      expect(currency.name).toBeTruthy();
      expect(currency.name.length).toBeGreaterThan(0);
    });
  });
});
