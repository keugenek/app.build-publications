import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { getCurrencies } from '../handlers/get_currencies';
import { type CurrencyInfo, currencyCodeSchema } from '../schema';

describe('getCurrencies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all supported currencies', async () => {
    const result = await getCurrencies();

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify we have the expected number of currencies
    expect(result.length).toBe(11);
  });

  it('should return currencies with correct structure', async () => {
    const result = await getCurrencies();

    result.forEach(currency => {
      expect(currency).toHaveProperty('code');
      expect(currency).toHaveProperty('name');
      expect(currency).toHaveProperty('symbol');
      
      // Validate types
      expect(typeof currency.code).toBe('string');
      expect(typeof currency.name).toBe('string');
      expect(typeof currency.symbol).toBe('string');
      
      // Validate code is a valid currency enum value
      expect(() => currencyCodeSchema.parse(currency.code)).not.toThrow();
    });
  });

  it('should include major currencies', async () => {
    const result = await getCurrencies();
    const codes = result.map(currency => currency.code);

    // Verify presence of major currencies
    expect(codes).toContain('USD');
    expect(codes).toContain('EUR');
    expect(codes).toContain('GBP');
    expect(codes).toContain('JPY');
  });

  it('should include proper currency names and symbols', async () => {
    const result = await getCurrencies();
    
    // Find specific currencies and validate their metadata
    const usd = result.find(c => c.code === 'USD');
    expect(usd).toBeDefined();
    expect(usd?.name).toBe('US Dollar');
    expect(usd?.symbol).toBe('$');

    const eur = result.find(c => c.code === 'EUR');
    expect(eur).toBeDefined();
    expect(eur?.name).toBe('Euro');
    expect(eur?.symbol).toBe('€');

    const gbp = result.find(c => c.code === 'GBP');
    expect(gbp).toBeDefined();
    expect(gbp?.name).toBe('British Pound');
    expect(gbp?.symbol).toBe('£');
  });

  it('should return currencies in consistent order', async () => {
    const result1 = await getCurrencies();
    const result2 = await getCurrencies();

    expect(result1).toEqual(result2);
    
    // Verify order by checking first few currencies
    expect(result1[0].code).toBe('USD');
    expect(result1[1].code).toBe('EUR');
    expect(result1[2].code).toBe('GBP');
  });

  it('should return immutable data', async () => {
    const result = await getCurrencies();
    const originalLength = result.length;
    
    // Attempt to modify the returned array
    result.push({ code: 'XXX' as any, name: 'Test Currency', symbol: 'X' });
    
    // Get fresh result and verify original data is unchanged
    const freshResult = await getCurrencies();
    expect(freshResult.length).toBe(originalLength);
    expect(freshResult).not.toContain({ code: 'XXX', name: 'Test Currency', symbol: 'X' });
  });

  it('should include Nordic currencies', async () => {
    const result = await getCurrencies();
    const codes = result.map(currency => currency.code);

    // Verify Nordic currencies are included
    expect(codes).toContain('SEK');
    expect(codes).toContain('NOK');
    expect(codes).toContain('DKK');

    // Verify their symbols (they all use 'kr')
    const sek = result.find(c => c.code === 'SEK');
    const nok = result.find(c => c.code === 'NOK');
    const dkk = result.find(c => c.code === 'DKK');

    expect(sek?.symbol).toBe('kr');
    expect(nok?.symbol).toBe('kr');
    expect(dkk?.symbol).toBe('kr');
  });

  it('should include all currencies from schema enum', async () => {
    const result = await getCurrencies();
    const codes = result.map(currency => currency.code);

    // Expected currencies from the schema
    const expectedCurrencies = [
      'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 
      'AUD', 'NZD', 'SEK', 'NOK', 'DKK'
    ];

    expectedCurrencies.forEach(expectedCode => {
      expect(codes).toContain(expectedCode);
    });

    // Verify we don't have extra currencies
    expect(codes.length).toBe(expectedCurrencies.length);
  });
});
