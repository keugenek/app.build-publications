import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { getMaintenanceRecords } from '../handlers/get_maintenance_records';
import { type MaintenanceRecord } from '../schema';

// Helper to insert a maintenance record directly
const insertRecord = async (data: {
  service_date: Date;
  service_type: string;
  mileage: number;
  cost: number;
  notes?: string | null;
  created_at: Date;
}) => {
  const result = await db
    .insert(maintenanceRecordsTable)
    .values({
      service_date: data.service_date,
      service_type: data.service_type,
      mileage: data.mileage,
      cost: data.cost.toString(), // numeric column requires string
      notes: data.notes ?? undefined,
      created_at: data.created_at,
    })
    .returning()
    .execute();
  return result[0] as any;
};

describe('getMaintenanceRecords', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all records sorted by newest first with numeric conversion', async () => {
    const olderDate = new Date('2023-01-01T10:00:00Z');
    const newerDate = new Date('2023-01-02T12:00:00Z');

    // Insert two records with distinct created_at timestamps
    await insertRecord({
      service_date: new Date('2023-01-01'),
      service_type: 'Oil Change',
      mileage: 1000,
      cost: 19.99,
      notes: null,
      created_at: olderDate,
    });

    await insertRecord({
      service_date: new Date('2023-01-02'),
      service_type: 'Tire Rotation',
      mileage: 2000,
      cost: 29.95,
      notes: null,
      created_at: newerDate,
    });

    const records = await getMaintenanceRecords();

    // Expect two records returned
    expect(records).toHaveLength(2);

    // Verify sorting: newest first (newerDate)
    expect(records[0].service_type).toBe('Tire Rotation');
    expect(records[0].created_at).toEqual(newerDate);
    expect(typeof records[0].cost).toBe('number');
    expect(records[0].cost).toBeCloseTo(29.95);

    // Verify older record is second
    expect(records[1].service_type).toBe('Oil Change');
    expect(records[1].created_at).toEqual(olderDate);
    expect(typeof records[1].cost).toBe('number');
    expect(records[1].cost).toBeCloseTo(19.99);
  });
});
