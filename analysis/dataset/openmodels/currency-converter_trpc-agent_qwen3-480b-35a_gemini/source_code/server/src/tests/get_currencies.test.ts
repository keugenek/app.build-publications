import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { currenciesTable } from '../db/schema';
import { getCurrencies } from '../handlers/get_currencies';

describe('getCurrencies', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test currencies
    await db.insert(currenciesTable).values([
      { code: 'USD', name: 'US Dollar', symbol: '$' },
      { code: 'EUR', name: 'Euro', symbol: '€' },
      { code: 'GBP', name: 'British Pound', symbol: '£' },
      { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all currencies from the database', async () => {
    const result = await getCurrencies();
    
    expect(result).toHaveLength(4);
    
    // Check that we have the expected currencies
    const currencyCodes = result.map(currency => currency.code).sort();
    expect(currencyCodes).toEqual(['EUR', 'GBP', 'JPY', 'USD'].sort());
    
    // Verify specific currency data
    const usdCurrency = result.find(currency => currency.code === 'USD');
    expect(usdCurrency).toBeDefined();
    expect(usdCurrency!.name).toEqual('US Dollar');
    expect(usdCurrency!.symbol).toEqual('$');
  });

  it('should return currencies with correct types', async () => {
    const result = await getCurrencies();
    
    expect(result).toBeInstanceOf(Array);
    expect(result.length).toBeGreaterThan(0);
    
    // Check the structure of the first currency
    const firstCurrency = result[0];
    expect(firstCurrency).toHaveProperty('code');
    expect(firstCurrency).toHaveProperty('name');
    expect(firstCurrency).toHaveProperty('symbol');
    
    // Verify all properties are strings
    expect(typeof firstCurrency.code).toBe('string');
    expect(typeof firstCurrency.name).toBe('string');
    expect(typeof firstCurrency.symbol).toBe('string');
  });
});
