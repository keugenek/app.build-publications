import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type Plant, moodEnum } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Fetch all plants from the database.
 * Converts the timestamp to a Date object and derives the plant's mood.
 * Mood logic: if the plant was watered within the last 24 hours, it's 'Happy', otherwise 'Thirsty'.
 */
export async function getPlants(): Promise<Plant[]> {
  try {
    const rows = await db.select().from(plantsTable).execute();
    const now = new Date();
    const DAY_MS = 24 * 60 * 60 * 1000;
    return rows.map(row => {
      const lastWatered = new Date(row.last_watered);
      const mood: typeof moodEnum[number] = now.getTime() - lastWatered.getTime() <= DAY_MS ? 'Happy' : 'Thirsty';
      return {
        id: row.id,
        name: row.name,
        type: row.type,
        last_watered: lastWatered,
        mood,
      } as Plant;
    });
  } catch (error) {
    console.error('Failed to get plants:', error);
    throw error;
  }
}
