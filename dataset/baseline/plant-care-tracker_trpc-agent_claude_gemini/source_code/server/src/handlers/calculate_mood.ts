import { type Plant, type PlantMood, type LightExposure } from '../schema';

/**
 * Calculate plant mood based on last watered date and light exposure
 * Rules:
 * - Happy: Watered within 7 days AND medium/high light
 * - Thirsty: Not watered for 7+ days BUT has adequate light (medium/high)
 * - Needs Sun: Has low light exposure BUT watered recently (within 7 days)
 * - Wilting: Not watered for 7+ days AND low light (worst case)
 */
export function calculatePlantMood(plant: Plant): PlantMood {
  // This is a placeholder declaration! Real code should be implemented here.
  // The goal of this handler is to calculate the mood of a plant based on predefined rules.
  
  const now = new Date();
  const daysSinceWatered = Math.floor((now.getTime() - plant.last_watered_date.getTime()) / (1000 * 60 * 60 * 24));
  const isRecentlyWatered = daysSinceWatered < 7;
  const hasGoodLight = plant.light_exposure === 'medium' || plant.light_exposure === 'high';

  if (isRecentlyWatered && hasGoodLight) {
    return 'Happy';
  } else if (!isRecentlyWatered && hasGoodLight) {
    return 'Thirsty';
  } else if (isRecentlyWatered && !hasGoodLight) {
    return 'Needs Sun';
  } else {
    return 'Wilting';
  }
}
