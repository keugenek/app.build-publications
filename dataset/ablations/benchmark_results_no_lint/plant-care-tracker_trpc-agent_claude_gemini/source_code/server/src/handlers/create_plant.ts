import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type Plant, type PlantMood } from '../schema';

// Helper function to calculate plant mood based on conditions
function calculatePlantMood(lastWatered: Date, sunlightExposure: string): PlantMood {
  const now = new Date();
  const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
  
  // Over-watered: watered less than 1 day ago
  if (daysSinceWatered < 1) {
    return 'Over-watered';
  }
  
  // Thirsty: not watered for more than 2 days
  if (daysSinceWatered > 2) {
    return 'Thirsty';
  }
  
  // Sun-deprived: has Low sunlight exposure
  if (sunlightExposure === 'Low') {
    return 'Sun-deprived';
  }
  
  // Happy: watered within last 2 days and has Medium or High sunlight
  if (daysSinceWatered <= 2 && (sunlightExposure === 'Medium' || sunlightExposure === 'High')) {
    return 'Happy';
  }
  
  // Default case (should not normally reach here)
  return 'Sun-deprived';
}

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        last_watered: input.last_watered,
        sunlight_exposure: input.sunlight_exposure
      })
      .returning()
      .execute();

    // Calculate mood for the created plant
    const plant = result[0];
    const mood = calculatePlantMood(plant.last_watered, plant.sunlight_exposure);

    return {
      ...plant,
      mood
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};
