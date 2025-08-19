import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionsTable } from '../db/schema';
import { type CreateConversionInput } from '../schema';
import { getConversionHistory } from '../handlers/get_conversion_history';

// Test data for conversions
const testConversions: CreateConversionInput[] = [
  {
    amount: 100.00,
    from_currency: 'USD',
    to_currency: 'EUR',
    exchange_rate: 0.85,
    converted_amount: 85.00
  },
  {
    amount: 50.00,
    from_currency: 'EUR',
    to_currency: 'GBP',
    exchange_rate: 0.86,
    converted_amount: 43.00
  },
  {
    amount: 200.00,
    from_currency: 'USD',
    to_currency: 'JPY',
    exchange_rate: 149.50,
    converted_amount: 29900.00
  }
];

// Helper function to create test conversions
const createTestConversions = async (conversions: CreateConversionInput[]) => {
  const results = [];
  for (const conversion of conversions) {
    const result = await db.insert(conversionsTable)
      .values({
        amount: conversion.amount.toString(),
        from_currency: conversion.from_currency,
        to_currency: conversion.to_currency,
        exchange_rate: conversion.exchange_rate.toString(),
        converted_amount: conversion.converted_amount.toString()
      })
      .returning()
      .execute();
    results.push(result[0]);
  }
  return results;
};

describe('getConversionHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no conversions exist', async () => {
    const result = await getConversionHistory();
    
    expect(result).toEqual([]);
  });

  it('should return all conversions with correct data types', async () => {
    // Create test conversions
    await createTestConversions(testConversions);
    
    const result = await getConversionHistory();
    
    expect(result).toHaveLength(3);
    
    // Verify each conversion has correct structure and types
    result.forEach(conversion => {
      expect(conversion.id).toBeDefined();
      expect(typeof conversion.id).toBe('number');
      expect(typeof conversion.amount).toBe('number');
      expect(typeof conversion.from_currency).toBe('string');
      expect(typeof conversion.to_currency).toBe('string');
      expect(typeof conversion.exchange_rate).toBe('number');
      expect(typeof conversion.converted_amount).toBe('number');
      expect(conversion.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return conversions in descending order by creation date', async () => {
    // Create test conversions with small delays to ensure different timestamps
    await createTestConversions([testConversions[0]]);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await createTestConversions([testConversions[1]]);
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await createTestConversions([testConversions[2]]);
    
    const result = await getConversionHistory();
    
    expect(result).toHaveLength(3);
    
    // Verify order - most recent should be first
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].created_at.getTime()
      );
    }
  });

  it('should correctly convert numeric values', async () => {
    await createTestConversions([testConversions[0]]);
    
    const result = await getConversionHistory();
    
    expect(result).toHaveLength(1);
    const conversion = result[0];
    
    // Verify numeric conversions are exact
    expect(conversion.amount).toEqual(100.00);
    expect(conversion.exchange_rate).toEqual(0.85);
    expect(conversion.converted_amount).toEqual(85.00);
    expect(conversion.from_currency).toEqual('USD');
    expect(conversion.to_currency).toEqual('EUR');
  });

  it('should handle high precision exchange rates correctly', async () => {
    const highPrecisionConversion: CreateConversionInput = {
      amount: 1000.00,
      from_currency: 'BTC',
      to_currency: 'USD',
      exchange_rate: 43856.12345678, // High precision rate
      converted_amount: 43856123.46
    };
    
    await createTestConversions([highPrecisionConversion]);
    
    const result = await getConversionHistory();
    
    expect(result).toHaveLength(1);
    const conversion = result[0];
    
    // Verify high precision values are handled correctly
    expect(conversion.exchange_rate).toBeCloseTo(43856.12345678, 8);
    expect(conversion.amount).toEqual(1000.00);
    expect(conversion.converted_amount).toBeCloseTo(43856123.46, 2);
  });

  it('should handle multiple conversions with same currency pairs', async () => {
    const sameCurrencyConversions: CreateConversionInput[] = [
      {
        amount: 100.00,
        from_currency: 'USD',
        to_currency: 'EUR',
        exchange_rate: 0.85,
        converted_amount: 85.00
      },
      {
        amount: 200.00,
        from_currency: 'USD',
        to_currency: 'EUR',
        exchange_rate: 0.84, // Different rate
        converted_amount: 168.00
      }
    ];
    
    await createTestConversions(sameCurrencyConversions);
    
    const result = await getConversionHistory();
    
    expect(result).toHaveLength(2);
    
    // Both should be present with correct values
    const amounts = result.map(c => c.amount).sort();
    expect(amounts).toEqual([100.00, 200.00]);
    
    const rates = result.map(c => c.exchange_rate).sort();
    expect(rates).toEqual([0.84, 0.85]);
  });

  it('should verify data persistence in database', async () => {
    await createTestConversions([testConversions[0]]);
    
    // Get history through handler
    const handlerResult = await getConversionHistory();
    
    // Query database directly for verification
    const dbResult = await db.select()
      .from(conversionsTable)
      .execute();
    
    expect(handlerResult).toHaveLength(1);
    expect(dbResult).toHaveLength(1);
    
    // Verify handler result matches database
    const handlerConversion = handlerResult[0];
    const dbConversion = dbResult[0];
    
    expect(handlerConversion.id).toEqual(dbConversion.id);
    expect(handlerConversion.from_currency).toEqual(dbConversion.from_currency);
    expect(handlerConversion.to_currency).toEqual(dbConversion.to_currency);
    expect(handlerConversion.amount).toEqual(parseFloat(dbConversion.amount));
    expect(handlerConversion.exchange_rate).toEqual(parseFloat(dbConversion.exchange_rate));
    expect(handlerConversion.converted_amount).toEqual(parseFloat(dbConversion.converted_amount));
  });
});
