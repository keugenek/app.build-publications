import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionHistoryTable } from '../db/schema';
import { getConversionHistory } from '../handlers/get_conversion_history';

describe('getConversionHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no conversion history exists', async () => {
    const result = await getConversionHistory();
    expect(result).toEqual([]);
  });

  it('should return conversion history ordered by timestamp', async () => {
    // Insert test data
    const testHistory = [
      {
        amount: '100.00',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        convertedAmount: '85.00',
        exchangeRate: '0.850000',
      },
      {
        amount: '50.00',
        fromCurrency: 'USD',
        toCurrency: 'GBP',
        convertedAmount: '38.00',
        exchangeRate: '0.760000',
      }
    ];

    // Insert records one by one to control timestamp order
    await db.insert(conversionHistoryTable).values(testHistory[0]).execute();
    await db.insert(conversionHistoryTable).values(testHistory[1]).execute();

    const result = await getConversionHistory();

    // Should return both records
    expect(result).toHaveLength(2);

    // Check first record
    expect(result[0].amount).toEqual(100.00);
    expect(result[0].fromCurrency).toEqual('USD');
    expect(result[0].toCurrency).toEqual('EUR');
    expect(result[0].convertedAmount).toEqual(85.00);
    expect(result[0].exchangeRate).toEqual(0.850000);
    expect(result[0].id).toBeDefined();
    expect(result[0].timestamp).toBeInstanceOf(Date);

    // Check second record
    expect(result[1].amount).toEqual(50.00);
    expect(result[1].fromCurrency).toEqual('USD');
    expect(result[1].toCurrency).toEqual('GBP');
    expect(result[1].convertedAmount).toEqual(38.00);
    expect(result[1].exchangeRate).toEqual(0.760000);
    expect(result[1].id).toBeDefined();
    expect(result[1].timestamp).toBeInstanceOf(Date);

    // Verify ordering by timestamp
    expect(result[0].timestamp.getTime()).toBeLessThanOrEqual(result[1].timestamp.getTime());
  });

  it('should properly convert numeric fields', async () => {
    // Insert test data with numeric values
    const testData = {
      amount: '99.99',
      fromCurrency: 'USD',
      toCurrency: 'JPY',
      convertedAmount: '10000.50',
      exchangeRate: '100.010000',
    };

    await db.insert(conversionHistoryTable).values(testData).execute();

    const result = await getConversionHistory();

    expect(result).toHaveLength(1);
    
    // Verify numeric conversions
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].amount).toBeCloseTo(99.99);
    
    expect(typeof result[0].convertedAmount).toBe('number');
    expect(result[0].convertedAmount).toBeCloseTo(10000.50);
    
    expect(typeof result[0].exchangeRate).toBe('number');
    expect(result[0].exchangeRate).toBeCloseTo(100.010000);
  });
});
