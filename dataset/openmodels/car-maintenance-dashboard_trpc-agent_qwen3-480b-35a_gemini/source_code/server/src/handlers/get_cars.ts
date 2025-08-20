import { db } from '../db';
import { carsTable } from '../db/schema';
import { type Car } from '../schema';

export const getCars = async (): Promise<Car[]> => {
  try {
    const result = await db.select()
      .from(carsTable)
      .execute();
    
    return result.map(car => ({
      ...car,
      year: Number(car.year) // Ensure year is a number
    }));
  } catch (error) {
    console.error('Failed to fetch cars:', error);
    throw error;
  }
};
