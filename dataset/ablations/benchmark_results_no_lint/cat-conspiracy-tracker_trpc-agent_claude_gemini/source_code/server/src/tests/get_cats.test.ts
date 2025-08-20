import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { type CreateCatInput } from '../schema';
import { getCats } from '../handlers/get_cats';

describe('getCats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no cats exist', async () => {
    const result = await getCats();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return a single cat', async () => {
    // Create a test cat
    const testCat: CreateCatInput = {
      name: 'Whiskers',
      breed: 'Persian',
      age: 3,
      description: 'Extremely suspicious - stares at walls for hours'
    };

    await db.insert(catsTable)
      .values({
        name: testCat.name,
        breed: testCat.breed,
        age: testCat.age,
        description: testCat.description
      })
      .execute();

    const result = await getCats();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Whiskers');
    expect(result[0].breed).toEqual('Persian');
    expect(result[0].age).toEqual(3);
    expect(result[0].description).toEqual('Extremely suspicious - stares at walls for hours');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple cats', async () => {
    // Create multiple test cats
    const testCats: CreateCatInput[] = [
      {
        name: 'Shadow',
        breed: 'Maine Coon',
        age: 5,
        description: 'Knocks things off tables with calculated precision'
      },
      {
        name: 'Mittens',
        breed: null,
        age: null,
        description: null
      },
      {
        name: 'Professor Fluffington',
        breed: 'British Shorthair',
        age: 7,
        description: 'Clearly plotting world domination from the windowsill'
      }
    ];

    // Insert all cats
    for (const cat of testCats) {
      await db.insert(catsTable)
        .values({
          name: cat.name,
          breed: cat.breed,
          age: cat.age,
          description: cat.description
        })
        .execute();
    }

    const result = await getCats();

    expect(result).toHaveLength(3);
    
    // Check that all cats are returned
    const names = result.map(cat => cat.name).sort();
    expect(names).toEqual(['Mittens', 'Professor Fluffington', 'Shadow']);

    // Verify data integrity for each cat
    const shadowCat = result.find(cat => cat.name === 'Shadow');
    expect(shadowCat).toBeDefined();
    expect(shadowCat!.breed).toEqual('Maine Coon');
    expect(shadowCat!.age).toEqual(5);
    expect(shadowCat!.description).toEqual('Knocks things off tables with calculated precision');

    const mittensCat = result.find(cat => cat.name === 'Mittens');
    expect(mittensCat).toBeDefined();
    expect(mittensCat!.breed).toBeNull();
    expect(mittensCat!.age).toBeNull();
    expect(mittensCat!.description).toBeNull();

    const professorCat = result.find(cat => cat.name === 'Professor Fluffington');
    expect(professorCat).toBeDefined();
    expect(professorCat!.breed).toEqual('British Shorthair');
    expect(professorCat!.age).toEqual(7);
    expect(professorCat!.description).toEqual('Clearly plotting world domination from the windowsill');

    // Verify all cats have required fields
    result.forEach(cat => {
      expect(cat.id).toBeDefined();
      expect(typeof cat.id).toBe('number');
      expect(cat.name).toBeDefined();
      expect(typeof cat.name).toBe('string');
      expect(cat.created_at).toBeInstanceOf(Date);
    });
  });

  it('should maintain correct order based on database insertion', async () => {
    // Create cats in specific order
    const catsInOrder = ['First Cat', 'Second Cat', 'Third Cat'];
    
    for (const name of catsInOrder) {
      await db.insert(catsTable)
        .values({
          name: name,
          breed: 'Test Breed',
          age: 1,
          description: 'Test description'
        })
        .execute();
    }

    const result = await getCats();

    expect(result).toHaveLength(3);
    // Verify cats are returned (likely in insertion order by ID)
    expect(result[0].name).toEqual('First Cat');
    expect(result[1].name).toEqual('Second Cat');
    expect(result[2].name).toEqual('Third Cat');
  });

  it('should handle cats with all nullable fields as null', async () => {
    // Create a cat with minimal required data
    await db.insert(catsTable)
      .values({
        name: 'Minimal Cat'
        // breed, age, description are all optional/nullable
      })
      .execute();

    const result = await getCats();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Minimal Cat');
    expect(result[0].breed).toBeNull();
    expect(result[0].age).toBeNull();
    expect(result[0].description).toBeNull();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
