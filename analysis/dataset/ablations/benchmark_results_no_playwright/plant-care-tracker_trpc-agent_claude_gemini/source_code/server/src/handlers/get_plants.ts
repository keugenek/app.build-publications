import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type PlantWithMood } from '../schema';

// Helper function to calculate plant mood based on last watered date
function calculatePlantMood(lastWatered: Date): 'Happy' | 'Thirsty' {
    const now = new Date();
    const daysSinceWatered = Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceWatered <= 3 ? 'Happy' : 'Thirsty';
}

export async function getPlants(): Promise<PlantWithMood[]> {
    try {
        // Fetch all plants from the database
        const results = await db.select()
            .from(plantsTable)
            .execute();

        // Transform results to include mood calculation
        return results.map(plant => ({
            id: plant.id,
            name: plant.name,
            last_watered: plant.last_watered,
            created_at: plant.created_at,
            mood: calculatePlantMood(plant.last_watered)
        }));
    } catch (error) {
        console.error('Failed to fetch plants:', error);
        throw error;
    }
}
