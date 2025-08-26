import { type CreateMaintenanceInput, type UpdateMaintenanceInput, type MaintenanceRecord } from '../schema';
import { db } from '../db';
import { maintenanceRecordsTable } from '../db/schema';
import type { NewMaintenanceRecord } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * CRUD operations for maintenance records.
 * Numeric columns (cost) are stored as numeric, requiring string conversion on insert/update
 * and parsing back to number on reads.
 */

/** Create a maintenance record. */
export async function createMaintenance(input: CreateMaintenanceInput): Promise<MaintenanceRecord> {
  try {
    const result = await db
      .insert(maintenanceRecordsTable)
      .values({
        car_id: input.car_id,
        service_date: input.service_date,
        service_type: input.service_type,
        odometer: input.odometer,
        cost: input.cost.toString(), // numeric stored as string
        notes: input.notes ?? null,
        next_service_due: input.next_service_due ?? null
      })
      .returning()
      .execute();

    const record = result[0];
    return {
      ...record,
      cost: parseFloat(record.cost as any)
    } as MaintenanceRecord;
  } catch (error) {
    console.error('Failed to create maintenance record:', error);
    throw error;
  }
}

/** Fetch all maintenance records for a given car. */
export async function getMaintenancesByCar(car_id: number): Promise<MaintenanceRecord[]> {
  try {
    const results = await db
      .select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.car_id, car_id))
      .execute();

    return results.map(r => ({
      ...r,
      cost: parseFloat(r.cost as any)
    }) as MaintenanceRecord);
  } catch (error) {
    console.error('Failed to fetch maintenances:', error);
    throw error;
  }
}

/** Update a maintenance record with provided fields. */
export async function updateMaintenance(input: UpdateMaintenanceInput): Promise<MaintenanceRecord> {
  try {
    const values: Partial<NewMaintenanceRecord> = {} as any;
    if (input.service_date !== undefined) values.service_date = input.service_date;
    if (input.service_type !== undefined) values.service_type = input.service_type;
    if (input.odometer !== undefined) values.odometer = input.odometer;
    if (input.cost !== undefined) values.cost = input.cost.toString();
    if (input.notes !== undefined) values.notes = input.notes;
    if (input.next_service_due !== undefined) values.next_service_due = input.next_service_due;

    const result = await db
      .update(maintenanceRecordsTable)
      .set(values)
      .where(eq(maintenanceRecordsTable.id, input.id))
      .returning()
      .execute();

    const updated = result[0];
    return {
      ...updated,
      cost: parseFloat(updated.cost as any)
    } as MaintenanceRecord;
  } catch (error) {
    console.error('Failed to update maintenance record:', error);
    throw error;
  }
}

/** Delete a maintenance record by id. Returns true if deletion succeeded. */
export async function deleteMaintenance(id: number): Promise<boolean> {
  try {
    await db
      .delete(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, id))
      .returning()
      .execute();
    // Verify deletion
    const remaining = await db
      .select()
      .from(maintenanceRecordsTable)
      .where(eq(maintenanceRecordsTable.id, id))
      .execute();
    return remaining.length === 0;
  } catch (error) {
    console.error('Failed to delete maintenance record:', error);
    throw error;
  }
}
