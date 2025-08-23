// Tests for getPlants handler
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plants } from '../db/schema';
import { type Plant } from '../schema';
import { getPlants } from '../handlers/get_plants';
import { eq } from 'drizzle-orm';

describe('getPlants', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no plants exist', async () => {
    const result = await getPlants();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should return all plants from the database', async () => {
    // Insert a plant directly
    const insertResult = await db
      .insert(plants)
      .values({
        name: 'Fiddle Leaf Fig',
        species: 'Ficus lyrata',
        // omit last_watered to use DB default (now)
      })
      .returning()
      .execute();

    const insertedPlant = insertResult[0] as Plant;
    // Ensure the inserted record has a Date for last_watered
    expect(insertedPlant.last_watered).toBeInstanceOf(Date);

    const fetched = await getPlants();
    expect(fetched).toHaveLength(1);
    const plant = fetched[0];
    expect(plant.id).toBe(insertedPlant.id);
    expect(plant.name).toBe('Fiddle Leaf Fig');
    expect(plant.species).toBe('Ficus lyrata');
    expect(plant.last_watered).toBeInstanceOf(Date);
    // Compare timestamps (allow small difference)
    expect(Math.abs(plant.last_watered.getTime() - insertedPlant.last_watered.getTime())).toBeLessThan(2000);
  });

  it('should return multiple plants correctly', async () => {
    const plantsToInsert = [
      { name: 'Snake Plant', species: 'Sansevieria trifasciata' },
      { name: 'Aloe Vera', species: 'Aloe barbadensis' },
    ];

    for (const p of plantsToInsert) {
      await db.insert(plants).values(p).execute();
    }

    const fetched = await getPlants();
    expect(fetched).toHaveLength(2);
    const names = fetched.map(p => p.name).sort();
    expect(names).toEqual(['Aloe Vera', 'Snake Plant']);
  });
});
