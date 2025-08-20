import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type PlantWithMood } from '../schema';

export const getPlants = async (): Promise<PlantWithMood[]> => {
  try {
    // Fetch all plants from the database
    const plants = await db.select()
      .from(plantsTable)
      .execute();

    // Calculate mood for each plant based on watering date
    const currentDate = new Date();
    const threeDaysAgo = new Date(currentDate);
    threeDaysAgo.setDate(currentDate.getDate() - 3);

    return plants.map(plant => {
      // Determine mood based on last watering date
      const mood = plant.last_watered >= threeDaysAgo ? 'Happy' : 'Thirsty';

      return {
        id: plant.id,
        name: plant.name,
        last_watered: plant.last_watered,
        created_at: plant.created_at,
        mood
      } as PlantWithMood;
    });
  } catch (error) {
    console.error('Failed to fetch plants:', error);
    throw error;
  }
};
