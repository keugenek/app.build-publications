import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type Cat } from '../schema';
import { getCats } from '../handlers/get_cats';
import { eq } from 'drizzle-orm';

describe('getCats handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all cats from the database', async () => {
    // Insert sample cats
    const cat1 = await db.insert(catsTable).values({
      name: 'Whiskers',
      owner_name: 'Alice',
    }).returning().execute();
    const cat2 = await db.insert(catsTable).values({
      name: 'Shadow',
      // owner_name omitted -> null
    }).returning().execute();

    const result: Cat[] = await getCats();

    // Expect two cats returned
    expect(result).toHaveLength(2);

    // Find by name for easier assertions
    const fetchedWhiskers = result.find((c) => c.name === 'Whiskers');
    const fetchedShadow = result.find((c) => c.name === 'Shadow');

    expect(fetchedWhiskers).toBeDefined();
    expect(fetchedWhiskers?.owner_name).toBe('Alice');
    expect(fetchedWhiskers?.id).toBe(cat1[0].id);
    expect(fetchedWhiskers?.created_at).toBeInstanceOf(Date);

    expect(fetchedShadow).toBeDefined();
    expect(fetchedShadow?.owner_name).toBeNull();
    expect(fetchedShadow?.id).toBe(cat2[0].id);
    expect(fetchedShadow?.created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no cats exist', async () => {
    const result = await getCats();
    expect(result).toEqual([]);
  });
});
