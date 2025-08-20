import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput } from '../schema';
import { createCat } from '../handlers/create_cat';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateCatInput = {
  name: 'Whiskers',
  description: 'A suspicious orange tabby with plotting eyes'
};

const minimalInput: CreateCatInput = {
  name: 'Shadow',
  description: null
};

describe('createCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat with full details', async () => {
    const result = await createCat(testInput);

    // Basic field validation
    expect(result.name).toEqual('Whiskers');
    expect(result.description).toEqual('A suspicious orange tabby with plotting eyes');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a cat with minimal details (null description)', async () => {
    const result = await createCat(minimalInput);

    expect(result.name).toEqual('Shadow');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save cat to database', async () => {
    const result = await createCat(testInput);

    // Query using proper drizzle syntax
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, result.id))
      .execute();

    expect(cats).toHaveLength(1);
    expect(cats[0].name).toEqual('Whiskers');
    expect(cats[0].description).toEqual('A suspicious orange tabby with plotting eyes');
    expect(cats[0].created_at).toBeInstanceOf(Date);
    expect(cats[0].id).toEqual(result.id);
  });

  it('should auto-increment cat IDs', async () => {
    const cat1 = await createCat(testInput);
    const cat2 = await createCat(minimalInput);

    expect(cat2.id).toBeGreaterThan(cat1.id);
    expect(cat2.id - cat1.id).toEqual(1);
  });

  it('should handle multiple cats with same name', async () => {
    const duplicateNameInput: CreateCatInput = {
      name: 'Mittens',
      description: 'First Mittens'
    };

    const duplicateNameInput2: CreateCatInput = {
      name: 'Mittens',
      description: 'Second Mittens'
    };

    const cat1 = await createCat(duplicateNameInput);
    const cat2 = await createCat(duplicateNameInput2);

    expect(cat1.name).toEqual(cat2.name);
    expect(cat1.id).not.toEqual(cat2.id);
    expect(cat1.description).toEqual('First Mittens');
    expect(cat2.description).toEqual('Second Mittens');
  });

  it('should preserve created_at timestamp accuracy', async () => {
    const beforeCreate = new Date();
    const result = await createCat(testInput);
    const afterCreate = new Date();

    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
  });
});
