import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type Plant } from '../schema';
import { getPlants } from '../handlers/get_plants';
import { eq } from 'drizzle-orm';

/** Helper to insert a plant */
async function insertPlant(name: string, type: string, lastWatered: Date) {
  await db.insert(plantsTable).values({
    name,
    type,
    last_watered: lastWatered,
  }).execute();
}

describe('getPlants handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all plants with derived mood', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    // Insert plants with different last_watered dates
    await insertPlant('Fern', 'Indoor', now);
    await insertPlant('Cactus', 'Outdoor', twoDaysAgo);

    const result = await getPlants();

    // Expect two plants returned
    expect(result).toHaveLength(2);

    // Find each by name
    const fern = result.find(p => p.name === 'Fern') as Plant;
    const cactus = result.find(p => p.name === 'Cactus') as Plant;

    // Verify fields and mood
    expect(fern).toBeDefined();
    expect(fern.mood).toBe('Happy');
    expect(fern.last_watered).toBeInstanceOf(Date);

    expect(cactus).toBeDefined();
    expect(cactus.mood).toBe('Thirsty');
    expect(cactus.last_watered).toBeInstanceOf(Date);
  });

  it('should return empty array when no plants exist', async () => {
    const result = await getPlants();
    expect(result).toEqual([]);
  });
});
