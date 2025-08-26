import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput, type Plant } from '../schema';

export const createPlant = async (input: CreatePlantInput): Promise<Plant> => {
  try {
    // Set default lastWateredDate to now if not provided
    const lastWateredDate = input.lastWateredDate || new Date();
    
    // Insert plant record
    const result = await db.insert(plantsTable)
      .values({
        name: input.name,
        lastWateredDate: lastWateredDate,
        createdAt: new Date()
      })
      .returning()
      .execute();

    const plant = result[0];
    
    // Calculate mood based on last watered date
    const mood = calculateMood(lastWateredDate);
    
    return {
      id: plant.id,
      name: plant.name,
      lastWateredDate: plant.lastWateredDate,
      mood,
      createdAt: plant.createdAt
    };
  } catch (error) {
    console.error('Plant creation failed:', error);
    throw error;
  }
};

// Helper function to determine plant mood based on last watered date
const calculateMood = (lastWateredDate: Date): 'Happy' | 'Thirsty' => {
  const daysSinceWatered = (new Date().getTime() - lastWateredDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysSinceWatered > 7 ? 'Thirsty' : 'Happy';
};
