import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { plants } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Test input without last_watered (should use DB default)
const testInputNoDate: CreatePlantInput = {
  name: 'Aloe Vera',
  species: 'Aloe',
  // last_watered omitted
};

// Test input with explicit last_watered
const explicitDate = new Date('2023-01-01T12:00:00Z');
const testInputWithDate: CreatePlantInput = {
  name: 'Spider Plant',
  species: 'Chlorophytum',
  last_watered: explicitDate,
};

describe('createPlant handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a plant with default last_watered when omitted', async () => {
    const result = await createPlant(testInputNoDate);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Aloe Vera');
    expect(result.species).toBe('Aloe');
    // DB default should be a recent Date (within a minute of now)
    expect(result.last_watered).toBeInstanceOf(Date);
    const now = new Date();
    const diff = Math.abs(now.getTime() - result.last_watered.getTime());
    expect(diff).toBeLessThan(60_000); // less than 1 minute
  });

  it('creates a plant preserving explicit last_watered', async () => {
    const result = await createPlant(testInputWithDate);

    expect(result.id).toBeDefined();
    expect(result.name).toBe('Spider Plant');
    expect(result.species).toBe('Chlorophytum');
    expect(result.last_watered.getTime()).toBe(explicitDate.getTime());
  });

  it('persists the plant record in the database', async () => {
    const created = await createPlant(testInputNoDate);

    const rows = await db
      .select()
      .from(plants)
      .where(eq(plants.id, created.id))
      .execute();

    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe(created.name);
    expect(row.species).toBe(created.species);
    expect(row.last_watered).toBeInstanceOf(Date);
    // Ensure the stored date matches the returned one
    expect(row.last_watered.getTime()).toBe(created.last_watered.getTime());
  });
});
