import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { plantsTable } from '../db/schema';
import { type CreatePlantInput } from '../schema';
import { createPlant } from '../handlers/create_plant';
import { eq } from 'drizzle-orm';

// Helper to generate a date offset by given days
const daysAgo = (days: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
};

describe('createPlant handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('creates a plant with default last_watered_at and happy mood', async () => {
    const input: CreatePlantInput = {
      name: 'Fern',
      species: 'Polypodiopsida',
      // no last_watered_at provided, should default to now
    };

    const result = await createPlant(input);

    // Verify returned fields
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe('Fern');
    expect(result.species).toBe('Polypodiopsida');
    expect(result.last_watered_at).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.mood).toBe('happy');

    // Verify persisted in DB
    const rows = await db.select().from(plantsTable).where(eq(plantsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe('Fern');
    expect(row.species).toBe('Polypodiopsida');
  });

  it('creates a plant with provided last_watered_at older than 7 days and thirsty mood', async () => {
    const oldDate = daysAgo(10);
    const input: CreatePlantInput = {
      name: 'Cactus',
      species: 'Cactaceae',
      last_watered_at: oldDate,
    };

    const result = await createPlant(input);

    expect(result.mood).toBe('thirsty');
    // Ensure the stored last_watered_at matches input (to the second)
    expect(Math.abs(result.last_watered_at.getTime() - oldDate.getTime())).toBeLessThan(1000);

    // Verify DB row
    const rows = await db.select().from(plantsTable).where(eq(plantsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.last_watered_at).toBeInstanceOf(Date);
    expect(Math.abs((row.last_watered_at as Date).getTime() - oldDate.getTime())).toBeLessThan(1000);
  });
});
