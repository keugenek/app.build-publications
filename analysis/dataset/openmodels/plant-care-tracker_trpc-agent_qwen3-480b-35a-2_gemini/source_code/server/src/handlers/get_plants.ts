import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type PlantWithMood } from '../schema';

// Calculate plant mood based on last watered date and light exposure
const calculateMood = (lastWatered: Date, lightExposure: 'low' | 'medium' | 'high'): string => {
  const now = new Date();
  const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
  
  // If watered within the last 3 days, plant is happy
  if (daysSinceWatered < 3) {
    return 'happy';
  }
  // If watered within the last 7 days, plant is okay
  else if (daysSinceWatered < 7) {
    // Plants with high light exposure get thirsty faster
    if (lightExposure === 'high') {
      return 'thirsty';
    }
    return 'okay';
  }
  // If not watered for more than 7 days, plant is sad
  else {
    return 'sad';
  }
};

export const getPlants = async (): Promise<PlantWithMood[]> => {
  try {
    const plants = await db.select()
      .from(plantsTable)
      .execute();

    return plants.map(plant => ({
      id: plant.id,
      name: plant.name,
      species: plant.species,
      lastWatered: plant.lastWatered,
      lightExposure: plant.lightExposure,
      createdAt: plant.createdAt,
      mood: calculateMood(plant.lastWatered, plant.lightExposure)
    }));
  } catch (error) {
    console.error('Failed to fetch plants:', error);
    throw error;
  }
};
