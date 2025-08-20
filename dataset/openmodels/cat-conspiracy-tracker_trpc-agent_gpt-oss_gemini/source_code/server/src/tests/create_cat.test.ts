import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput, type Cat } from '../schema';
import { createCat } from '../handlers/create_cat';
import { eq } from 'drizzle-orm';

// Test input includes optional owner_name variations
const testInput: CreateCatInput = {
  name: 'Whiskers',
  // owner_name omitted to test undefined handling
} as any;

describe('createCat handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat with generated fields', async () => {
    const result = await createCat(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.name).toBe('Whiskers');
    expect(result.owner_name).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist cat in the database', async () => {
    const result = await createCat(testInput);
    const rows = await db.select().from(catsTable).where(eq(catsTable.id, result.id)).execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.name).toBe('Whiskers');
    expect(row.owner_name).toBeNull();
    expect(row.created_at).toBeInstanceOf(Date);
  });

  it('should handle provided owner_name', async () => {
    const input: CreateCatInput = { name: 'Paws', owner_name: 'Alice' };
    const result = await createCat(input);
    expect(result.owner_name).toBe('Alice');
    const rows = await db.select().from(catsTable).where(eq(catsTable.id, result.id)).execute();
    expect(rows[0].owner_name).toBe('Alice');
  });
});
