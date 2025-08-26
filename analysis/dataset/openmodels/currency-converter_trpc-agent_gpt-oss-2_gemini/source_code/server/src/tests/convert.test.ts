import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { conversionLogs } from '../db/schema';
import { type ConvertInput } from '../schema';
import { convert } from '../handlers/convert';
// import { eq } from 'drizzle-orm';

const testInput: ConvertInput = {
  amount: 100,
  from: 'USD',
  to: 'EUR'
};

describe('convert handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return correct conversion output', async () => {
    const result = await convert(testInput);
    expect(result.amount).toBe(testInput.amount);
    expect(result.from).toBe(testInput.from);
    expect(result.to).toBe(testInput.to);
    expect(result.rate).toBe(1.23);
    expect(result.convertedAmount).toBeCloseTo(testInput.amount * 1.23);
  });

  it('should persist conversion log with proper numeric handling', async () => {
    const result = await convert(testInput);

    const logs = await db
      .select()
      .from(conversionLogs)
      .execute();

    expect(logs).toHaveLength(1);
    const log = logs[0];
    // Numeric fields are stored as strings; convert back for assertions
    expect(parseFloat(log.amount)).toBeCloseTo(testInput.amount);
    expect(log.from).toBe(testInput.from);
    expect(log.to).toBe(testInput.to);
    expect(parseFloat(log.converted_amount)).toBeCloseTo(result.convertedAmount);
    expect(parseFloat(log.rate)).toBeCloseTo(1.23);
    expect(log.created_at).toBeInstanceOf(Date);
  });
});
