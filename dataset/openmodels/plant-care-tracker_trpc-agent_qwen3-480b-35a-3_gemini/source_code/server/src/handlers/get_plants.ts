import { type PlantWithMood } from '../schema';
import { db } from '../db';
import { plantsTable } from '../db/schema';

export const getPlants = async (): Promise<PlantWithMood[]> => {
  try {
    // The goal of this handler is fetching all plants from the database and calculating their moods.
    const plants = await db.select().from(plantsTable);
    
    // Calculate mood for each plant based on the rules
    return plants.map(plant => {
      const lastWatered = new Date(plant.lastWateredDate);
      const today = new Date();
      const daysSinceWatered = Math.floor((today.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
      
      let mood = "Happy Sprout"; // Default mood
      
      // Rule 1: If lastWateredDate is more than 7 days ago, the mood is "Thirsty Leaf"
      if (daysSinceWatered > 7) {
        mood = "Thirsty Leaf";
      }
      // Rule 2: If lightLevel is "low" AND lastWateredDate is less than 3 days ago, the mood is "Overwatered and Sad"
      else if (plant.lightLevel === "low" && daysSinceWatered < 3) {
        mood = "Overwatered and Sad";
      }
      // Rule 3: Otherwise, the mood is "Happy Sprout" (already set as default)
      
      return {
        ...plant,
        mood
      };
    });
  } catch (error) {
    console.error('Failed to fetch plants:', error);
    throw error;
  }
};
