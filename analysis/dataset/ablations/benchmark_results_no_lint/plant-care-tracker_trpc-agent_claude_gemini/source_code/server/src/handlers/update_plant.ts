import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput, type Plant, type PlantMood } from '../schema';
import { eq } from 'drizzle-orm';

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

export async function updatePlant(input: UpdatePlantInput): Promise<Plant> {
  try {
    // First, fetch the existing plant to ensure it exists and get current values
    const existingPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .execute();

    if (existingPlants.length === 0) {
      throw new Error(`Plant with id ${input.id} not found`);
    }

    const existingPlant = existingPlants[0];

    // Prepare update data with only provided fields
    const updateData: Partial<{
      name: string;
      last_watered: Date;
      sunlight_exposure: 'Low' | 'Medium' | 'High';
    }> = {};

    if (input.name !== undefined) {
      updateData.name = input.name;
    }
    if (input.last_watered !== undefined) {
      updateData.last_watered = input.last_watered;
    }
    if (input.sunlight_exposure !== undefined) {
      updateData.sunlight_exposure = input.sunlight_exposure;
    }

    // Only perform update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await db.update(plantsTable)
        .set(updateData)
        .where(eq(plantsTable.id, input.id))
        .execute();
    }

    // Fetch the updated plant data
    const updatedPlants = await db.select()
      .from(plantsTable)
      .where(eq(plantsTable.id, input.id))
      .execute();

    const updatedPlant = updatedPlants[0];

    // Calculate mood based on the final values
    const mood = calculatePlantMood(updatedPlant.last_watered, updatedPlant.sunlight_exposure);

    return {
      id: updatedPlant.id,
      name: updatedPlant.name,
      last_watered: updatedPlant.last_watered,
      sunlight_exposure: updatedPlant.sunlight_exposure,
      created_at: updatedPlant.created_at,
      mood: mood
    };
  } catch (error) {
    console.error('Plant update failed:', error);
    throw error;
  }
}
