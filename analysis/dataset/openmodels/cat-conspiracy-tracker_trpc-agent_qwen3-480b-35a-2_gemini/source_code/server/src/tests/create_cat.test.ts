import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput } from '../schema';
import { createCat } from '../handlers/create_cat';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateCatInput = {
  name: 'Fluffy',
  breed: 'Persian',
  age: 3
};

const testInputWithoutOptional: CreateCatInput = {
  name: 'Whiskers',
  breed: null,
  age: null
};

describe('createCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat with all fields', async () => {
    const result = await createCat(testInput);

    // Basic field validation
    expect(result.name).toEqual('Fluffy');
    expect(result.breed).toEqual('Persian');
    expect(result.age).toEqual(3);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a cat with nullable fields', async () => {
    const result = await createCat(testInputWithoutOptional);

    // Basic field validation
    expect(result.name).toEqual('Whiskers');
    expect(result.breed).toBeNull();
    expect(result.age).toBeNull();
    expect(result.id).toBeDefined();
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
    expect(cats[0].name).toEqual('Fluffy');
    expect(cats[0].breed).toEqual('Persian');
    expect(cats[0].age).toEqual(3);
    expect(cats[0].created_at).toBeInstanceOf(Date);
  });
});
