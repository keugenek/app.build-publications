import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable } from '../db/schema';
import { type CreateCatProfileInput } from '../schema';
import { createCatProfile } from '../handlers/create_cat_profile';
import { eq } from 'drizzle-orm';

// Simple test input with all fields
const testInput: CreateCatProfileInput = {
  name: 'Whiskers',
  breed: 'Maine Coon',
  color: 'Orange Tabby',
  age_years: 3,
  suspicion_level: 'medium'
};

// Test input with minimal required fields
const minimalInput: CreateCatProfileInput = {
  name: 'Shadow',
  breed: null,
  color: null,
  suspicion_level: 'high'
};

describe('createCatProfile', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a cat profile with all fields', async () => {
    const result = await createCatProfile(testInput);

    // Basic field validation
    expect(result.name).toEqual('Whiskers');
    expect(result.breed).toEqual('Maine Coon');
    expect(result.color).toEqual('Orange Tabby');
    expect(result.age_years).toEqual(3);
    expect(result.suspicion_level).toEqual('medium');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a cat profile with minimal fields', async () => {
    const result = await createCatProfile(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Shadow');
    expect(result.breed).toBeNull();
    expect(result.color).toBeNull();
    expect(result.age_years).toBeNull();
    expect(result.suspicion_level).toEqual('high');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save cat profile to database', async () => {
    const result = await createCatProfile(testInput);

    // Query using proper drizzle syntax
    const profiles = await db.select()
      .from(catProfilesTable)
      .where(eq(catProfilesTable.id, result.id))
      .execute();

    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toEqual('Whiskers');
    expect(profiles[0].breed).toEqual('Maine Coon');
    expect(profiles[0].color).toEqual('Orange Tabby');
    expect(profiles[0].age_years).toEqual(3);
    expect(profiles[0].suspicion_level).toEqual('medium');
    expect(profiles[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle different suspicion levels', async () => {
    const suspicionLevels = ['low', 'medium', 'high', 'maximum'] as const;

    for (const level of suspicionLevels) {
      const input: CreateCatProfileInput = {
        name: `Cat-${level}`,
        breed: null,
        color: null,
        suspicion_level: level
      };

      const result = await createCatProfile(input);
      expect(result.suspicion_level).toEqual(level);
      expect(result.name).toEqual(`Cat-${level}`);
    }
  });

  it('should create multiple cat profiles independently', async () => {
    const input1: CreateCatProfileInput = {
      name: 'Felix',
      breed: 'Siamese',
      color: 'Seal Point',
      age_years: 5,
      suspicion_level: 'maximum'
    };

    const input2: CreateCatProfileInput = {
      name: 'Luna',
      breed: 'Persian',
      color: 'White',
      age_years: 2,
      suspicion_level: 'low'
    };

    const result1 = await createCatProfile(input1);
    const result2 = await createCatProfile(input2);

    // Verify they have different IDs
    expect(result1.id).not.toEqual(result2.id);

    // Verify their fields are correct
    expect(result1.name).toEqual('Felix');
    expect(result1.suspicion_level).toEqual('maximum');
    expect(result1.age_years).toEqual(5);

    expect(result2.name).toEqual('Luna');
    expect(result2.suspicion_level).toEqual('low');
    expect(result2.age_years).toEqual(2);

    // Verify both are saved in database
    const allProfiles = await db.select()
      .from(catProfilesTable)
      .execute();

    expect(allProfiles).toHaveLength(2);
    
    const names = allProfiles.map(p => p.name);
    expect(names).toContain('Felix');
    expect(names).toContain('Luna');
  });

  it('should handle age_years as optional field correctly', async () => {
    const inputWithoutAge: CreateCatProfileInput = {
      name: 'Mysterious Cat',
      breed: 'Unknown',
      color: 'Black',
      suspicion_level: 'maximum'
    };

    const result = await createCatProfile(inputWithoutAge);

    expect(result.name).toEqual('Mysterious Cat');
    expect(result.age_years).toBeNull();
    expect(result.breed).toEqual('Unknown');
    expect(result.color).toEqual('Black');
    expect(result.suspicion_level).toEqual('maximum');
  });
});
