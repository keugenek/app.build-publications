import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { createPlant } from '../handlers/create_plant';
import type { CreatePlantInput } from '../schema';
import { eq } from 'drizzle-orm';

// Helper to calculate date offset
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
};

describe('createPlant handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a plant with default last_watered (happy mood)', async () => {
    const input: CreatePlantInput = {
      name: 'Aloe Vera',
      type: 'Succulent',
    };

    const plant = await createPlant(input);

    // Verify returned object shape and mood
    expect(plant.id).toBeGreaterThan(0);
    expect(plant.name).toBe('Aloe Vera');
    expect(plant.type).toBe('Succulent');
    expect(plant.last_watered).toBeInstanceOf(Date);
    expect(plant.mood).toBe('Happy');

    // Verify persisted in DB
    const rows = await db.select().from(plantsTable).where(eq(plantsTable.id, plant.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe('Aloe Vera');
    expect(row.type).toBe('Succulent');
    // The stored timestamp should be close to now
    expect(row.last_watered.getTime()).toBeGreaterThan(Date.now() - 5000);
  });

  it('creates a plant with explicit old last_watered (thirsty mood)', async () => {
    const input: CreatePlantInput = {
      name: 'Fern',
      type: 'Indoor',
      last_watered: daysAgo(10), // older than 7 days
    };

    const plant = await createPlant(input);

    expect(plant.mood).toBe('Thirsty');
    expect(plant.last_watered.getTime()).toBeCloseTo(daysAgo(10).getTime(), -2);

    // Verify DB entry matches provided date
    const rows = await db.select().from(plantsTable).where(eq(plantsTable.id, plant.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.last_watered.getTime()).toBeCloseTo(daysAgo(10).getTime(), -2);
  });
});
