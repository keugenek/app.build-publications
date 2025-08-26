import { db } from '../db';
import { carsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Car } from '../schema';

export const getCar = async (id: number): Promise<Car | null> => {
  try {
    const result = await db.select()
      .from(carsTable)
      .where(eq(carsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const car = result[0];
    return {
      ...car,
      created_at: new Date(car.created_at),
      updated_at: new Date(car.updated_at)
    };
  } catch (error) {
    console.error('Failed to fetch car:', error);
    throw error;
  }
};
