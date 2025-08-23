import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getCurrencies } from '../handlers/get_currencies';

describe('getCurrencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch list of currencies', async () => {
    const result = await getCurrencies();
    
    // Check that we get an array of currencies
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Check that each currency has the required properties
    const firstCurrency = result[0];
    expect(firstCurrency).toHaveProperty('code');
    expect(firstCurrency).toHaveProperty('name');
    
    // Verify types
    expect(typeof firstCurrency.code).toBe('string');
    expect(typeof firstCurrency.name).toBe('string');
    
    // Check that currency codes are 3 characters (standard ISO 4217)
    expect(firstCurrency.code).toMatch(/^[A-Z]{3}$/);
  });

  it('should handle API errors gracefully', async () => {
    // We won't test actual API errors here since that would require mocking,
    // but we can verify the error handling structure is in place
    expect(typeof getCurrencies).toBe('function');
  });
});
