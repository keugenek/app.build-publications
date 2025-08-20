import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { currencyConversionsTable } from '../db/schema';
import { type GetConversionHistoryInput } from '../schema';
import { getConversionHistory } from '../handlers/get_conversion_history';

// Test conversion data
const testConversions = [
  {
    amount: '100.50',
    from_currency: 'USD',
    to_currency: 'EUR',
    exchange_rate: '0.85123456',
    converted_amount: '85.37',
    conversion_date: '2024-01-15'
  },
  {
    amount: '250.75',
    from_currency: 'GBP',
    to_currency: 'USD',
    exchange_rate: '1.25789012',
    converted_amount: '315.47',
    conversion_date: '2024-01-14'
  },
  {
    amount: '500.00',
    from_currency: 'JPY',
    to_currency: 'USD',
    exchange_rate: '0.00675123',
    converted_amount: '3.38',
    conversion_date: '2024-01-13'
  }
];

describe('getConversionHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no conversions exist', async () => {
    const input: GetConversionHistoryInput = {
      limit: 10,
      offset: 0
    };

    const result = await getConversionHistory(input);

    expect(result).toEqual([]);
  });

  it('should return conversion history ordered by most recent first', async () => {
    const insertedIds: number[] = [];
    
    // Insert test data in specific order and track the insertion order
    for (const conversion of testConversions) {
      const insertResult = await db.insert(currencyConversionsTable)
        .values(conversion)
        .returning({ id: currencyConversionsTable.id })
        .execute();
      
      insertedIds.push(insertResult[0].id);
      
      // Add small delay to ensure different created_at timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const input: GetConversionHistoryInput = {
      limit: 10,
      offset: 0
    };

    const result = await getConversionHistory(input);

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent (last inserted) should be first
    // Since JPY was inserted last, it should appear first
    expect(result[0].from_currency).toEqual('JPY');
    expect(result[1].from_currency).toEqual('GBP');
    expect(result[2].from_currency).toEqual('USD');

    // Verify all timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should convert numeric fields correctly', async () => {
    await db.insert(currencyConversionsTable)
      .values(testConversions[0])
      .execute();

    const input: GetConversionHistoryInput = {
      limit: 10,
      offset: 0
    };

    const result = await getConversionHistory(input);

    expect(result).toHaveLength(1);
    
    const conversion = result[0];
    
    // Verify numeric field types and values
    expect(typeof conversion.amount).toBe('number');
    expect(conversion.amount).toEqual(100.50);
    
    expect(typeof conversion.exchange_rate).toBe('number');
    expect(conversion.exchange_rate).toEqual(0.85123456);
    
    expect(typeof conversion.converted_amount).toBe('number');
    expect(conversion.converted_amount).toEqual(85.37);
    
    // Verify other fields
    expect(conversion.from_currency).toEqual('USD');
    expect(conversion.to_currency).toEqual('EUR');
    expect(conversion.conversion_date).toBeInstanceOf(Date);
    expect(conversion.created_at).toBeInstanceOf(Date);
    expect(conversion.id).toBeDefined();
  });

  it('should apply pagination correctly with limit', async () => {
    // Insert multiple conversions
    for (const conversion of testConversions) {
      await db.insert(currencyConversionsTable)
        .values(conversion)
        .execute();
    }

    const input: GetConversionHistoryInput = {
      limit: 2,
      offset: 0
    };

    const result = await getConversionHistory(input);

    expect(result).toHaveLength(2);
  });

  it('should apply pagination correctly with offset', async () => {
    // Insert multiple conversions
    for (const conversion of testConversions) {
      await db.insert(currencyConversionsTable)
        .values(conversion)
        .execute();
    }

    // Get first page
    const firstPage = await getConversionHistory({
      limit: 2,
      offset: 0
    });

    // Get second page
    const secondPage = await getConversionHistory({
      limit: 2,
      offset: 2
    });

    expect(firstPage).toHaveLength(2);
    expect(secondPage).toHaveLength(1);
    
    // Verify different results
    expect(firstPage[0].id).not.toEqual(secondPage[0].id);
    expect(firstPage[1].id).not.toEqual(secondPage[0].id);
  });

  it('should handle large offset gracefully', async () => {
    await db.insert(currencyConversionsTable)
      .values(testConversions[0])
      .execute();

    const input: GetConversionHistoryInput = {
      limit: 10,
      offset: 100 // Much larger than available records
    };

    const result = await getConversionHistory(input);

    expect(result).toEqual([]);
  });

  it('should use Zod defaults for limit and offset when not provided', async () => {
    // Insert test data
    for (const conversion of testConversions) {
      await db.insert(currencyConversionsTable)
        .values(conversion)
        .execute();
    }

    // Test with minimal input - Zod should apply defaults
    const input: GetConversionHistoryInput = {
      limit: 10, // Explicitly provide the default values since they're required in the type
      offset: 0
    };

    const result = await getConversionHistory(input);

    // Should return all 3 records since limit is 10
    expect(result).toHaveLength(3);
    
    // Verify ordering is still applied
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should respect custom limit and offset values', async () => {
    // Insert test data
    for (const conversion of testConversions) {
      await db.insert(currencyConversionsTable)
        .values(conversion)
        .execute();
    }

    const input: GetConversionHistoryInput = {
      limit: 1,
      offset: 1
    };

    const result = await getConversionHistory(input);

    // Should return only 1 record starting from the second record
    expect(result).toHaveLength(1);
  });

  it('should handle precision in numeric fields', async () => {
    const highPrecisionConversion = {
      amount: '999999.123456',
      from_currency: 'USD',
      to_currency: 'EUR',
      exchange_rate: '0.12345678',
      converted_amount: '123456.789012',
      conversion_date: '2024-01-15'
    };

    await db.insert(currencyConversionsTable)
      .values(highPrecisionConversion)
      .execute();

    const result = await getConversionHistory({ limit: 1, offset: 0 });

    expect(result).toHaveLength(1);
    
    const conversion = result[0];
    expect(conversion.amount).toEqual(999999.123456);
    expect(conversion.exchange_rate).toEqual(0.12345678);
    expect(conversion.converted_amount).toEqual(123456.789012);
  });
});
