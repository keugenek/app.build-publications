import { afterEach, beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getSupportedCurrencies, clearCache } from '../handlers/get_supported_currencies';
import { type SupportedCurrencies } from '../schema';

// Mock successful API response
const mockApiResponse = {
  'AUD': 'Australian Dollar',
  'CAD': 'Canadian Dollar', 
  'CHF': 'Swiss Franc',
  'CNY': 'Chinese Yuan',
  'EUR': 'Euro',
  'GBP': 'Pound Sterling',
  'JPY': 'Japanese Yen',
  'USD': 'US Dollar'
};

describe('getSupportedCurrencies', () => {
  let mockFetch: any;

  beforeEach(async () => {
    await createDB();
    
    // Clear the cache before each test
    clearCache();

    // Mock global fetch
    mockFetch = spyOn(global, 'fetch');
  });

  afterEach(async () => {
    await resetDB();
    mockFetch.mockRestore();
  });

  it('should fetch currencies from Frankfurter API', async () => {
    // Setup successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    const result = await getSupportedCurrencies();

    // Verify API was called correctly
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://api.frankfurter.app/currencies');

    // Verify result structure and content
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that currencies are sorted alphabetically
    const codes = result.map(currency => currency.code);
    const sortedCodes = [...codes].sort();
    expect(codes).toEqual(sortedCodes);

    // Verify each currency has required fields
    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(currency.code).toMatch(/^[A-Z]{3}$/); // 3 uppercase letters
      expect(currency.name.length).toBeGreaterThan(0);
    });

    // Verify specific currencies are present
    const usdCurrency = result.find(c => c.code === 'USD');
    expect(usdCurrency).toBeDefined();
    expect(usdCurrency?.name).toBe('US Dollar');

    const eurCurrency = result.find(c => c.code === 'EUR');
    expect(eurCurrency).toBeDefined();
    expect(eurCurrency?.name).toBe('Euro');
  });

  it('should use cached data on subsequent calls', async () => {
    // Setup successful API response for first call
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse
    });

    // First call should hit API
    const firstResult = await getSupportedCurrencies();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Second call should use cache (no additional API call)
    const secondResult = await getSupportedCurrencies();
    expect(mockFetch).toHaveBeenCalledTimes(1); // Still only 1 call

    // Results should be identical
    expect(secondResult).toEqual(firstResult);
  });

  it('should handle API failure gracefully', async () => {
    // Setup failed API response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    const result = await getSupportedCurrencies();

    // Verify fallback currencies are returned
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Should contain common currencies as fallback
    const codes = result.map(c => c.code);
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('GBP');
    expect(codes).toContain('JPY');

    // Verify structure is still correct
    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency.code).toMatch(/^[A-Z]{3}$/);
    });
  });

  it('should handle network errors gracefully', async () => {
    // Setup network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await getSupportedCurrencies();

    // Should still return fallback currencies
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toEqual(8); // Fallback has 8 currencies

    // Verify common currencies are included
    const usdCurrency = result.find(c => c.code === 'USD');
    expect(usdCurrency).toBeDefined();
    expect(usdCurrency?.name).toBe('US Dollar');
  });

  it('should handle malformed API response', async () => {
    // Setup malformed API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => { throw new Error('Invalid JSON'); }
    });

    const result = await getSupportedCurrencies();

    // Should return fallback currencies
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Verify fallback structure
    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
    });
  });

  it('should prefer custom currency names over API names', async () => {
    // Setup API response with different name for GBP
    const customApiResponse = {
      ...mockApiResponse,
      'GBP': 'Great British Pound' // Different from our mapping
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => customApiResponse
    });

    const result = await getSupportedCurrencies();

    // Should use our custom name mapping, not API name
    const gbpCurrency = result.find(c => c.code === 'GBP');
    expect(gbpCurrency?.name).toBe('British Pound'); // Our mapping
  });

  it('should handle currencies not in name mapping gracefully', async () => {
    // Add a currency not in our mapping
    const responseWithUnknown = {
      'XYZ': 'Test Currency'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => responseWithUnknown
    });

    const result = await getSupportedCurrencies();

    // Should use API name as fallback for unknown currencies
    const xyzCurrency = result.find(c => c.code === 'XYZ');
    expect(xyzCurrency?.name).toBe('Test Currency');
  });

  it('should return currencies sorted by code', async () => {
    // Setup response with currencies in random order
    const unsortedResponse = {
      'ZAR': 'South African Rand',
      'AUD': 'Australian Dollar',
      'USD': 'US Dollar',
      'EUR': 'Euro'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => unsortedResponse
    });

    const result = await getSupportedCurrencies();

    // Verify they are sorted alphabetically by code
    const codes = result.map(c => c.code);
    expect(codes).toEqual(['AUD', 'EUR', 'USD', 'ZAR']);
  });
});
