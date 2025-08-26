import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { updatePlant } from '../handlers/update_plant';
import type { UpdatePlantInput } from '../schema';

/**
 * Helper to create a plant directly in the DB for testing.
 */
async function createPlantInDB(name: string, type: string, lastWatered: Date) {
  const result = await db
    .insert(plantsTable)
    .values({ name, type, last_watered: lastWatered })
    .returning()
    .execute();
  return result[0];
}

describe('updatePlant handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates the last watered date and returns Happy mood for recent watering', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const plant = await createPlantInDB('Aloe', 'Succulent', oldDate);

    const newDate = new Date(); // now
    const input: UpdatePlantInput = { id: plant.id, last_watered: newDate };
    const updated = await updatePlant(input);

    // Verify returned object
    expect(updated.id).toBe(plant.id);
    expect(updated.last_watered.getTime()).toBeCloseTo(newDate.getTime(), -1);
    expect(updated.mood).toBe('Happy');

    // Verify DB state
    const rows = await db
      .select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plant.id))
      .execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].last_watered.getTime()).toBeCloseTo(newDate.getTime(), -1);
  });

  it('returns Thirsty mood when last watered is older than a week', async () => {
    const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const plant = await createPlantInDB('Cactus', 'Desert', new Date()); // initially recent

    const input: UpdatePlantInput = { id: plant.id, last_watered: oldDate };
    const updated = await updatePlant(input);

    expect(updated.mood).toBe('Thirsty');
    // DB should reflect the old date
    const rows = await db
      .select()
      .from(plantsTable)
      .where(eq(plantsTable.id, plant.id))
      .execute();
    expect(rows[0].last_watered.getTime()).toBeCloseTo(oldDate.getTime(), -1);
  });
});
