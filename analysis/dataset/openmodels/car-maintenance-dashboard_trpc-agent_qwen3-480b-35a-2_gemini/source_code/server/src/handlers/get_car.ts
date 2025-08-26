import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';
import { eq } from 'drizzle-orm';

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
      year: car.year, // Integer stays as integer
      nextServiceMileage: car.nextServiceMileage, // Integer stays as integer
      nextServiceDate: car.nextServiceDate ? new Date(car.nextServiceDate) : null,
      created_at: new Date(car.created_at)
    };
  } catch (error) {
    console.error('Failed to fetch car:', error);
    throw error;
  }
};
