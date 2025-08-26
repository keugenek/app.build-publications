import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { carsTable, maintenanceRecordsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateMaintenanceInput, type UpdateMaintenanceInput } from '../schema';
import { createMaintenance, getMaintenancesByCar, updateMaintenance, deleteMaintenance } from '../handlers/maintenance_handlers';

// Helper to create a car for foreign key
const createTestCar = async () => {
  const result = await db
    .insert(carsTable)
    .values({
      make: 'TestMake',
      model: 'TestModel',
      year: 2020,
      license_plate: `TEST-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    })
    .returning()
    .execute();
  return result[0];
};

const testMaintenanceInput = (car_id: number): CreateMaintenanceInput => ({
  car_id,
  service_date: new Date(),
  service_type: 'Oil Change',
  odometer: 12345,
  cost: 79.99,
  notes: 'Changed oil filter',
  next_service_due: null
});

describe('maintenance_handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a maintenance record', async () => {
    const car = await createTestCar();
    const input = testMaintenanceInput(car.id);
    const record = await createMaintenance(input);

    expect(record.id).toBeDefined();
    expect(record.car_id).toBe(car.id);
    expect(record.service_type).toBe('Oil Change');
    expect(record.cost).toBe(79.99);
    expect(typeof record.cost).toBe('number');
    expect(record.notes).toBe('Changed oil filter');
    expect(record.created_at).toBeInstanceOf(Date);
  });

  it('fetches maintenances by car', async () => {
    const car = await createTestCar();
    const input1 = testMaintenanceInput(car.id);
    const input2 = { ...input1, service_type: 'Tire Rotation', cost: 49.5 };
    await createMaintenance(input1);
    await createMaintenance(input2);

    const records = await getMaintenancesByCar(car.id);
    expect(records).toHaveLength(2);
    const types = records.map(r => r.service_type).sort();
    expect(types).toEqual(['Oil Change', 'Tire Rotation']);
  });

  it('updates a maintenance record', async () => {
    const car = await createTestCar();
    const input = testMaintenanceInput(car.id);
    const created = await createMaintenance(input);

    const updateInput: UpdateMaintenanceInput = {
      id: created.id,
      cost: 99.99,
      notes: 'Updated notes'
    };
    const updated = await updateMaintenance(updateInput);
    expect(updated.id).toBe(created.id);
    expect(updated.cost).toBe(99.99);
    expect(updated.notes).toBe('Updated notes');
  });

  it('deletes a maintenance record', async () => {
    const car = await createTestCar();
    const input = testMaintenanceInput(car.id);
    const created = await createMaintenance(input);
    const deleted = await deleteMaintenance(created.id);
    expect(deleted).toBe(true);

    const remaining = await db
      .select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, created.id))
      .execute();
    expect(remaining).toHaveLength(0);
  });
});
