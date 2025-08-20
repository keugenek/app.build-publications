import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type UpdatePlantInput } from '../schema';
import { updatePlant } from '../handlers/update_plant';
import { eq } from 'drizzle-orm';

// Helper to insert a plant directly for test setup
const insertPlant = async (name: string, species: string, lastWateredAt: Date) => {
  const result = await db
    .insert(plantsTable)
    .values({ name, species, last_watered_at: lastWateredAt })
    .returning()
    .execute();
  return result[0];
};

describe('updatePlant handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('updates provided fields and computes happy mood when recently watered', async () => {
    const original = await insertPlant('Fern', 'Pteridophyta', new Date());
    const input: UpdatePlantInput = {
      id: original.id,
      name: 'Updated Fern',
      // species omitted, should stay the same
    };

    const updated = await updatePlant(input);

    expect(updated.id).toBe(original.id);
    expect(updated.name).toBe('Updated Fern');
    expect(updated.species).toBe(original.species);
    // Mood should be happy because last_watered_at is recent (now)
    expect(updated.mood).toBe('happy');
  });

  it('computes thirsty mood when last watered more than 7 days ago', async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10); // 10 days ago
    const original = await insertPlant('Cactus', 'Cactaceae', oldDate);
    const input: UpdatePlantInput = {
      id: original.id,
      // no updates, just trigger recompute
    };

    const updated = await updatePlant(input);
    expect(updated.mood).toBe('thirsty');
  });

  it('throws an error when plant does not exist', async () => {
    const input: UpdatePlantInput = { id: 9999, name: 'Ghost' };
    await expect(updatePlant(input)).rejects.toThrow('Plant with id 9999 not found');
  });
});
