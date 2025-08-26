import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type Plant } from '../schema';

export const getPlants = async (): Promise<Plant[]> => {
  try {
    const results = await db.select()
      .from(plantsTable)
      .orderBy(plantsTable.createdAt)
      .execute();

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return results.map(plant => {
      const lastWateredDate = new Date(plant.lastWateredDate);
      const createdAt = new Date(plant.createdAt);
      
      // Calculate mood: Happy if watered within the last week, Thirsty otherwise
      const mood = lastWateredDate >= oneWeekAgo ? 'Happy' : 'Thirsty' as const;

      return {
        id: plant.id,
        name: plant.name,
        lastWateredDate,
        mood,
        createdAt
      };
    });
  } catch (error) {
    console.error('Failed to fetch plants:', error);
    throw error;
  }
};
