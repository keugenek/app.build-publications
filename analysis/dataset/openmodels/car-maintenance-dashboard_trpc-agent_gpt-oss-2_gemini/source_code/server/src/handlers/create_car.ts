import { type CreateCarInput, type Car, type UpdateCarInput } from '../schema';
import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/** Create a new car record */
export async function createCar(input: CreateCarInput): Promise<Car> {
  try {
    const result = await db
      .insert(carsTable)
      .values({
        make: input.make,
        model: input.model,
        year: input.year,
        license_plate: input.license_plate
      })
      .returning()
      .execute();
    const car = result[0];
    // Convert timestamp to Date instance
    return {
      ...car,
      created_at: new Date(car.created_at)
    } as Car;
  } catch (error) {
    console.error('Failed to create car:', error);
    throw error;
  }
}

/** Retrieve all cars */
export async function getCars(): Promise<Car[]> {
  const rows = await db.select().from(carsTable).execute();
  return rows.map(row => ({
    ...row,
    created_at: new Date(row.created_at)
  } as Car));
}

/** Retrieve a single car by its ID */
export async function getCar(id: number): Promise<Car | null> {
  const rows = await db
    .select()
    .from(carsTable)
    .where(eq(carsTable.id, id))
    .execute();
  if (rows.length === 0) return null;
  const car = rows[0];
  return {
    ...car,
    created_at: new Date(car.created_at)
  } as Car;
}

/** Update an existing car */
export async function updateCar(input: UpdateCarInput): Promise<Car> {
  try {
    const updates: Partial<typeof carsTable.$inferInsert> = {};
    if (input.make !== undefined) updates.make = input.make;
    if (input.model !== undefined) updates.model = input.model;
    if (input.year !== undefined) updates.year = input.year;
    if (input.license_plate !== undefined) updates.license_plate = input.license_plate;

    const result = await db
      .update(carsTable)
      .set(updates)
      .where(eq(carsTable.id, input.id))
      .returning()
      .execute();
    const car = result[0];
    return {
      ...car,
      created_at: new Date(car.created_at)
    } as Car;
  } catch (error) {
    console.error('Failed to update car:', error);
    throw error;
  }
}

/** Delete a car by ID */
export async function deleteCar(id: number): Promise<boolean> {
  try {
    await db.delete(carsTable).where(eq(carsTable.id, id)).execute();
    return true;
  } catch (error) {
    console.error('Failed to delete car:', error);
    return false;
  }
}
