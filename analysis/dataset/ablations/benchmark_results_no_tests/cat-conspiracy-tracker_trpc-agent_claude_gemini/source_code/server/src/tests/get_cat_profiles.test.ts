import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable } from '../db/schema';
import { getCatProfiles } from '../handlers/get_cat_profiles';

describe('getCatProfiles', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cat profiles exist', async () => {
    const result = await getCatProfiles();
    
    expect(result).toEqual([]);
  });

  it('should return single cat profile', async () => {
    // Create test cat
    await db.insert(catProfilesTable)
      .values({
        name: 'Whiskers',
        breed: 'Persian',
        color: 'Orange',
        age_years: 3,
        suspicion_level: 'medium'
      })
      .execute();

    const result = await getCatProfiles();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Whiskers');
    expect(result[0].breed).toEqual('Persian');
    expect(result[0].color).toEqual('Orange');
    expect(result[0].age_years).toEqual(3);
    expect(result[0].suspicion_level).toEqual('medium');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple cat profiles', async () => {
    // Create multiple test cats
    await db.insert(catProfilesTable)
      .values([
        {
          name: 'Mittens',
          breed: 'Siamese',
          color: 'Black',
          age_years: 2,
          suspicion_level: 'high'
        },
        {
          name: 'Shadow',
          breed: null,
          color: 'Gray',
          age_years: 5,
          suspicion_level: 'maximum'
        },
        {
          name: 'Fluffy',
          breed: 'Maine Coon',
          color: null,
          age_years: null,
          suspicion_level: 'low'
        }
      ])
      .execute();

    const result = await getCatProfiles();

    expect(result).toHaveLength(3);
    
    // Verify all cats are present (order might vary)
    const catNames = result.map(cat => cat.name);
    expect(catNames).toContain('Mittens');
    expect(catNames).toContain('Shadow');
    expect(catNames).toContain('Fluffy');

    // Check specific cat details
    const mittens = result.find(cat => cat.name === 'Mittens');
    expect(mittens?.breed).toEqual('Siamese');
    expect(mittens?.suspicion_level).toEqual('high');

    const shadow = result.find(cat => cat.name === 'Shadow');
    expect(shadow?.breed).toBeNull();
    expect(shadow?.color).toEqual('Gray');
    expect(shadow?.suspicion_level).toEqual('maximum');

    const fluffy = result.find(cat => cat.name === 'Fluffy');
    expect(fluffy?.age_years).toBeNull();
    expect(fluffy?.color).toBeNull();
    expect(fluffy?.suspicion_level).toEqual('low');
  });

  it('should handle cats with nullable fields correctly', async () => {
    // Create cat with various null fields
    await db.insert(catProfilesTable)
      .values({
        name: 'Mystery Cat',
        breed: null,
        color: null,
        age_years: null,
        suspicion_level: 'maximum'
      })
      .execute();

    const result = await getCatProfiles();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Mystery Cat');
    expect(result[0].breed).toBeNull();
    expect(result[0].color).toBeNull();
    expect(result[0].age_years).toBeNull();
    expect(result[0].suspicion_level).toEqual('maximum');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return cats with all suspicion levels', async () => {
    // Create cats with different suspicion levels
    await db.insert(catProfilesTable)
      .values([
        {
          name: 'Innocent',
          suspicion_level: 'low'
        },
        {
          name: 'Moderate',
          suspicion_level: 'medium'
        },
        {
          name: 'Suspect',
          suspicion_level: 'high'
        },
        {
          name: 'Dangerous',
          suspicion_level: 'maximum'
        }
      ])
      .execute();

    const result = await getCatProfiles();

    expect(result).toHaveLength(4);
    
    const suspicionLevels = result.map(cat => cat.suspicion_level);
    expect(suspicionLevels).toContain('low');
    expect(suspicionLevels).toContain('medium');
    expect(suspicionLevels).toContain('high');
    expect(suspicionLevels).toContain('maximum');
  });

  it('should verify database persistence', async () => {
    // Create a cat
    const insertResult = await db.insert(catProfilesTable)
      .values({
        name: 'Test Cat',
        breed: 'Test Breed',
        color: 'Test Color',
        age_years: 1,
        suspicion_level: 'low'
      })
      .returning()
      .execute();

    const insertedCat = insertResult[0];

    // Fetch using handler
    const handlerResult = await getCatProfiles();

    // Verify same data
    expect(handlerResult).toHaveLength(1);
    expect(handlerResult[0].id).toEqual(insertedCat.id);
    expect(handlerResult[0].name).toEqual(insertedCat.name);
    expect(handlerResult[0].created_at).toEqual(insertedCat.created_at);
  });
});
