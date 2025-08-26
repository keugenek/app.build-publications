import { type Plant, type PlantMood } from '../schema';

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

export async function getPlants(): Promise<Plant[]> {
  try {
    const { db } = await import('../db');
    const { plantsTable } = await import('../db/schema');
    
    // Fetch all plants from database
    const plants = await db.select()
      .from(plantsTable)
      .execute();

    // Transform database records to Plant schema with calculated moods
    return plants.map(plant => ({
      id: plant.id,
      name: plant.name,
      last_watered: plant.last_watered,
      sunlight_exposure: plant.sunlight_exposure,
      created_at: plant.created_at,
      mood: calculatePlantMood(plant.last_watered, plant.sunlight_exposure)
    }));
  } catch (error) {
    console.error('Failed to fetch plants:', error);
    throw error;
  }
}
