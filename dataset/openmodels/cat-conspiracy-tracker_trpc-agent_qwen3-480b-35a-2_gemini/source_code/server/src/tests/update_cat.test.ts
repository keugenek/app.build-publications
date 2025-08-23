import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type UpdateCatInput, type CreateCatInput } from '../schema';
import { updateCat } from '../handlers/update_cat';
import { eq } from 'drizzle-orm';

// Helper function to create a cat for testing
const createTestCat = async (input: CreateCatInput) => {
  const result = await db.insert(catsTable)
    .values({
      name: input.name,
      breed: input.breed || null,
      age: input.age || null
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a cat name', async () => {
    // Create a cat first
    const createdCat = await createTestCat({
      name: 'Fluffy',
      breed: 'Persian',
      age: 3
    });

    // Update the cat's name
    const updateInput: UpdateCatInput = {
      id: createdCat.id,
      name: 'Whiskers'
    };

    const result = await updateCat(updateInput);

    // Validate the result
    expect(result.id).toEqual(createdCat.id);
    expect(result.name).toEqual('Whiskers');
    expect(result.breed).toEqual('Persian');
    expect(result.age).toEqual(3);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update multiple cat fields', async () => {
    // Create a cat first
    const createdCat = await createTestCat({
      name: 'Mittens',
      breed: 'Siamese',
      age: 2
    });

    // Update multiple fields
    const updateInput: UpdateCatInput = {
      id: createdCat.id,
      breed: 'Maine Coon',
      age: 4
    };

    const result = await updateCat(updateInput);

    // Validate the result
    expect(result.id).toEqual(createdCat.id);
    expect(result.name).toEqual('Mittens'); // Should remain unchanged
    expect(result.breed).toEqual('Maine Coon');
    expect(result.age).toEqual(4);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update all cat fields', async () => {
    // Create a cat first
    const createdCat = await createTestCat({
      name: 'Shadow',
      breed: 'Black Cat',
      age: 5
    });

    // Update all fields
    const updateInput: UpdateCatInput = {
      id: createdCat.id,
      name: 'Midnight',
      breed: 'Tuxedo',
      age: 6
    };

    const result = await updateCat(updateInput);

    // Validate the result
    expect(result.id).toEqual(createdCat.id);
    expect(result.name).toEqual('Midnight');
    expect(result.breed).toEqual('Tuxedo');
    expect(result.age).toEqual(6);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save updated cat to database', async () => {
    // Create a cat first
    const createdCat = await createTestCat({
      name: 'Original Name',
      breed: 'Bengal',
      age: 1
    });

    // Update the cat
    const updateInput: UpdateCatInput = {
      id: createdCat.id,
      name: 'Updated Name'
    };

    await updateCat(updateInput);

    // Query the database to verify the update was saved
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, createdCat.id))
      .execute();

    expect(cats).toHaveLength(1);
    expect(cats[0].name).toEqual('Updated Name');
    expect(cats[0].breed).toEqual('Bengal'); // Should remain unchanged
    expect(cats[0].age).toEqual(1); // Should remain unchanged
    expect(cats[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw an error when updating a non-existent cat', async () => {
    const updateInput: UpdateCatInput = {
      id: 99999, // Non-existent ID
      name: 'Ghost Cat'
    };

    await expect(updateCat(updateInput))
      .rejects
      .toThrow(/Cat with id 99999 not found/);
  });

  it('should handle null values correctly', async () => {
    // Create a cat with all fields filled
    const createdCat = await createTestCat({
      name: 'Fluffy',
      breed: 'Persian',
      age: 3
    });

    // Update with null values
    const updateInput: UpdateCatInput = {
      id: createdCat.id,
      breed: null,
      age: null
    };

    const result = await updateCat(updateInput);

    // Validate the result
    expect(result.id).toEqual(createdCat.id);
    expect(result.name).toEqual('Fluffy'); // Should remain unchanged
    expect(result.breed).toBeNull();
    expect(result.age).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
