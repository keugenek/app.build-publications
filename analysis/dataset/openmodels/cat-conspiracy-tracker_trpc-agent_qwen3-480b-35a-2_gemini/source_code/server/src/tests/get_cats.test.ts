import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { getCats } from '../handlers/get_cats';

describe('getCats', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(catsTable).values([
      {
        name: 'Fluffy',
        breed: 'Persian',
        age: 3,
        created_at: new Date()
      },
      {
        name: 'Whiskers',
        breed: 'Siamese',
        age: 5,
        created_at: new Date()
      },
      {
        name: 'Mittens',
        breed: null,
        age: null,
        created_at: new Date()
      }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all cats from the database', async () => {
    const result = await getCats();
    
    expect(result).toHaveLength(3);
    
    // Check first cat
    expect(result[0].name).toEqual('Fluffy');
    expect(result[0].breed).toEqual('Persian');
    expect(result[0].age).toEqual(3);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second cat
    expect(result[1].name).toEqual('Whiskers');
    expect(result[1].breed).toEqual('Siamese');
    expect(result[1].age).toEqual(5);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    
    // Check third cat (with null values)
    expect(result[2].name).toEqual('Mittens');
    expect(result[2].breed).toBeNull();
    expect(result[2].age).toBeNull();
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
  });

  it('should return an empty array when no cats exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();
    
    const result = await getCats();
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should preserve the exact data structure', async () => {
    const result = await getCats();
    
    // Verify the structure matches our schema
    result.forEach(cat => {
      expect(typeof cat.id).toBe('number');
      expect(typeof cat.name).toBe('string');
      expect(cat.breed === null || typeof cat.breed === 'string').toBe(true);
      expect(cat.age === null || typeof cat.age === 'number').toBe(true);
      expect(cat.created_at).toBeInstanceOf(Date);
    });
  });
});
