import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput } from '../schema';
import { createCat } from '../handlers/create_cat';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCatInput = {
  name: 'Whiskers',
  breed: 'Maine Coon',
  age: 3,
  description: 'Extremely suspicious behavior - constantly stares at the ceiling'
};

// Test input with minimal required fields
const minimalInput: CreateCatInput = {
  name: 'Shadow',
  breed: null,
  age: null,
  description: null
};

describe('createCat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat with all fields', async () => {
    const result = await createCat(testInput);

    // Basic field validation
    expect(result.name).toEqual('Whiskers');
    expect(result.breed).toEqual('Maine Coon');
    expect(result.age).toEqual(3);
    expect(result.description).toEqual('Extremely suspicious behavior - constantly stares at the ceiling');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a cat with minimal required fields', async () => {
    const result = await createCat(minimalInput);

    // Verify required fields
    expect(result.name).toEqual('Shadow');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify nullable fields are properly handled
    expect(result.breed).toBeNull();
    expect(result.age).toBeNull();
    expect(result.description).toBeNull();
  });

  it('should save cat to database', async () => {
    const result = await createCat(testInput);

    // Query the database to verify the cat was saved
    const cats = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, result.id))
      .execute();

    expect(cats).toHaveLength(1);
    expect(cats[0].name).toEqual('Whiskers');
    expect(cats[0].breed).toEqual('Maine Coon');
    expect(cats[0].age).toEqual(3);
    expect(cats[0].description).toEqual('Extremely suspicious behavior - constantly stares at the ceiling');
    expect(cats[0].created_at).toBeInstanceOf(Date);
  });

  it('should assign unique IDs to multiple cats', async () => {
    const cat1 = await createCat({
      name: 'Fluffy',
      breed: 'Persian',
      age: 2,
      description: 'Plots world domination from windowsill'
    });

    const cat2 = await createCat({
      name: 'Mittens',
      breed: 'Siamese',
      age: 5,
      description: 'Suspicious midnight zoomies'
    });

    // Verify different IDs were assigned
    expect(cat1.id).not.toEqual(cat2.id);
    expect(typeof cat1.id).toBe('number');
    expect(typeof cat2.id).toBe('number');

    // Verify both cats exist in database
    const allCats = await db.select().from(catsTable).execute();
    expect(allCats).toHaveLength(2);
    
    const catNames = allCats.map(cat => cat.name).sort();
    expect(catNames).toEqual(['Fluffy', 'Mittens']);
  });

  it('should handle special characters in cat data', async () => {
    const specialInput: CreateCatInput = {
      name: "Mr. O'Malley",
      breed: 'British Shorthair',
      age: 7,
      description: 'Speaks in "meows" but clearly plotting something... suspicious quotation marks usage'
    };

    const result = await createCat(specialInput);

    expect(result.name).toEqual("Mr. O'Malley");
    expect(result.description).toEqual('Speaks in "meows" but clearly plotting something... suspicious quotation marks usage');

    // Verify it was saved correctly in the database
    const savedCat = await db.select()
      .from(catsTable)
      .where(eq(catsTable.id, result.id))
      .execute();

    expect(savedCat[0].name).toEqual("Mr. O'Malley");
    expect(savedCat[0].description).toEqual('Speaks in "meows" but clearly plotting something... suspicious quotation marks usage');
  });

  it('should set created_at timestamp automatically', async () => {
    const beforeCreation = new Date();
    const result = await createCat(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });
});
