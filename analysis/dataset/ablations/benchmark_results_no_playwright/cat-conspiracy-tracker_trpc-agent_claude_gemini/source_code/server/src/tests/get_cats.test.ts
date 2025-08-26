import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable } from '../db/schema';
import { getCats } from '../handlers/get_cats';

describe('getCats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cats exist', async () => {
    const result = await getCats();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all cats when cats exist', async () => {
    // Create test cats
    await db.insert(catsTable).values([
      {
        name: 'Whiskers',
        description: 'A fluffy orange cat with suspicious tendencies'
      },
      {
        name: 'Shadow',
        description: 'A black cat that watches from the shadows'
      },
      {
        name: 'Mittens',
        description: null
      }
    ]).execute();

    const result = await getCats();

    expect(result).toHaveLength(3);
    
    // Check that all expected cats are present
    const catNames = result.map(cat => cat.name);
    expect(catNames).toContain('Whiskers');
    expect(catNames).toContain('Shadow');
    expect(catNames).toContain('Mittens');

    // Check structure of returned cats
    result.forEach(cat => {
      expect(cat.id).toBeDefined();
      expect(typeof cat.id).toBe('number');
      expect(typeof cat.name).toBe('string');
      expect(cat.description === null || typeof cat.description === 'string').toBe(true);
      expect(cat.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return cats with correct field values', async () => {
    // Create a specific test cat
    await db.insert(catsTable).values({
      name: 'Test Cat',
      description: 'A test cat for validation'
    }).execute();

    const result = await getCats();

    expect(result).toHaveLength(1);
    
    const cat = result[0];
    expect(cat.name).toEqual('Test Cat');
    expect(cat.description).toEqual('A test cat for validation');
    expect(cat.id).toBeGreaterThan(0);
    expect(cat.created_at).toBeInstanceOf(Date);
  });

  it('should handle cats with null descriptions', async () => {
    // Create cats with and without descriptions
    await db.insert(catsTable).values([
      {
        name: 'Cat With Description',
        description: 'This cat has a description'
      },
      {
        name: 'Cat Without Description',
        description: null
      }
    ]).execute();

    const result = await getCats();

    expect(result).toHaveLength(2);
    
    const catWithDescription = result.find(cat => cat.name === 'Cat With Description');
    const catWithoutDescription = result.find(cat => cat.name === 'Cat Without Description');

    expect(catWithDescription?.description).toEqual('This cat has a description');
    expect(catWithoutDescription?.description).toBeNull();
  });

  it('should return cats in order they were created', async () => {
    // Create cats with slight delays to ensure different timestamps
    await db.insert(catsTable).values({
      name: 'First Cat',
      description: 'Created first'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    await db.insert(catsTable).values({
      name: 'Second Cat',
      description: 'Created second'
    }).execute();

    const result = await getCats();

    expect(result).toHaveLength(2);
    
    // Should be in insertion order (first cat has smaller ID)
    expect(result[0].name).toEqual('First Cat');
    expect(result[1].name).toEqual('Second Cat');
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
