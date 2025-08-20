import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { getPlants } from '../handlers/get_plants';

/**
 * Tests for the getPlants handler.
 * Verifies that plants are fetched from the database and that the derived "mood"
 * field is computed correctly based on the last watered timestamp.
 */
describe('getPlants handler', () => {
  beforeEach(async () => {
    await createDB();
  });

  afterEach(async () => {
    await resetDB();
  });

  it('should fetch all plants and compute mood correctly', async () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // Insert a recent plant (should be happy) and an older plant (should be thirsty)
    await db.insert(plantsTable).values([
      { name: 'Fern', species: 'Pteridophyta', last_watered_at: now },
      { name: 'Cactus', species: 'Cactaceae', last_watered_at: threeDaysAgo }
    ]).execute();

    const plants = await getPlants();
    expect(plants).toHaveLength(2);

    // Sort alphabetically for deterministic assertions
    const sorted = plants.sort((a, b) => a.name.localeCompare(b.name));
    const cactus = sorted[0];
    const fern = sorted[1];

    // Validate basic fields
    expect(cactus.name).toBe('Cactus');
    expect(fern.name).toBe('Fern');

    // Mood should be derived from watering date
    expect(cactus.mood).toBe('thirsty'); // older plant
    expect(fern.mood).toBe('happy'); // recent plant

    // Ensure date fields are proper Date objects
    expect(cactus.last_watered_at).toBeInstanceOf(Date);
    expect(fern.last_watered_at).toBeInstanceOf(Date);
    expect(cactus.created_at).toBeInstanceOf(Date);
    expect(fern.created_at).toBeInstanceOf(Date);
  });
});
