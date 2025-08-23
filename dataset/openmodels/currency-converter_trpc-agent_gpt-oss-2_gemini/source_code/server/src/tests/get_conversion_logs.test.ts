import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { conversionLogs } from '../db/schema';
import { listConversionLogs } from '../handlers/get_conversion_logs';

/** Helper to insert a conversion log directly into the DB */
const insertLog = async (input: {
  amount: number;
  from: string;
  to: string;
  convertedAmount: number;
  rate: number;
}) => {
  await db
    .insert(conversionLogs)
    .values({
      amount: input.amount.toString(),
      from: input.from as any,
      to: input.to as any,
      converted_amount: input.convertedAmount.toString(),
      rate: input.rate.toString(),
    })
    .execute();
};

describe('listConversionLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('returns an empty array when there are no logs', async () => {
    const logs = await listConversionLogs();
    expect(logs).toEqual([]);
  });

  it('returns all logs with correct numeric conversion and dates', async () => {
    const logData = [
      {
        amount: 100.5,
        from: 'USD',
        to: 'EUR',
        convertedAmount: 85.42,
        rate: 0.8487,
      },
      {
        amount: 250,
        from: 'GBP',
        to: 'JPY',
        convertedAmount: 37000,
        rate: 148.0,
      },
    ];

    for (const data of logData) {
      await insertLog(data);
    }

    const logs = await listConversionLogs();
    expect(logs).toHaveLength(logData.length);

    logs.forEach((log) => {
      const original = logData.find(
        (d) => d.amount === log.amount && d.from === log.from && d.to === log.to
      );
      expect(original).toBeDefined();
      expect(log.convertedAmount).toBeCloseTo(original!.convertedAmount);
      expect(log.rate).toBeCloseTo(original!.rate);
      expect(log.createdAt).toBeInstanceOf(Date);
    });
  });
});
