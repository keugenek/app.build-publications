import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import { type CreateMaintenanceInput } from '../schema';
import { createMaintenanceRecord } from '../handlers/create_maintenance_record';
import { eq, gte, between, and } from 'drizzle-orm';

const testInput: CreateMaintenanceInput = {
  service_date: new Date('2023-01-01T10:00:00Z'),
  service_type: 'Oil Change',
  mileage: 15000,
  cost: 79.99,
  notes: 'Changed oil and filter',
};

describe('createMaintenanceRecord', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a maintenance record with correct fields', async () => {
    const result = await createMaintenanceRecord(testInput);
    expect(result.service_type).toBe('Oil Change');
    expect(result.mileage).toBe(15000);
    expect(result.cost).toBe(79.99);
    expect(result.notes).toBe('Changed oil and filter');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.service_date).toBeInstanceOf(Date);
  });

  it('should persist the record in the database', async () => {
    const result = await createMaintenanceRecord(testInput);
    const rows = await db
      .select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.service_type).toBe('Oil Change');
    expect(row.mileage).toBe(15000);
    expect(parseFloat(row.cost as unknown as string)).toBe(79.99);
    expect(row.notes).toBe('Changed oil and filter');
    expect(row.created_at).toBeInstanceOf(Date);
    expect(row.service_date).toBeInstanceOf(Date);
  });

  it('should handle date range queries correctly', async () => {
    await createMaintenanceRecord(testInput);
    const today = new Date('2023-01-01T00:00:00Z');
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rows = await db
      .select()
      .from(maintenanceRecordsTable)
      .where(
        and(
          gte(maintenanceRecordsTable.service_date, today),
          between(maintenanceRecordsTable.service_date, today, tomorrow)
        )
      )
      .execute();
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(row => {
      expect(row.service_date >= today).toBe(true);
      expect(row.service_date <= tomorrow).toBe(true);
    });
  });
});
