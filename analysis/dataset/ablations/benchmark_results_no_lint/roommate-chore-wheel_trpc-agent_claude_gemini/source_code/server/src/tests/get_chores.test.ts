import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { getChores } from '../handlers/get_chores';

describe('getChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no chores exist', async () => {
    const result = await getChores();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all chores from database', async () => {
    // Create test chores
    await db.insert(choresTable).values([
      {
        name: 'Wash dishes',
        description: 'Clean all dirty dishes and utensils'
      },
      {
        name: 'Take out trash',
        description: 'Empty all trash bins and take to curb'
      },
      {
        name: 'Vacuum living room',
        description: null // Test nullable description
      }
    ]).execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    expect(result.every(chore => chore.id)).toBe(true);
    expect(result.every(chore => chore.name)).toBe(true);
    expect(result.every(chore => chore.created_at instanceof Date)).toBe(true);
  });

  it('should return chores ordered by creation date (newest first)', async () => {
    // Create chores with slight delays to ensure different timestamps
    await db.insert(choresTable).values({
      name: 'First chore',
      description: 'Created first'
    }).execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(choresTable).values({
      name: 'Second chore', 
      description: 'Created second'
    }).execute();

    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(choresTable).values({
      name: 'Third chore',
      description: 'Created third'
    }).execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].name).toBe('Third chore');
    expect(result[1].name).toBe('Second chore');
    expect(result[2].name).toBe('First chore');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle nullable description field correctly', async () => {
    await db.insert(choresTable).values([
      {
        name: 'Chore with description',
        description: 'This chore has a description'
      },
      {
        name: 'Chore without description',
        description: null
      }
    ]).execute();

    const result = await getChores();

    expect(result).toHaveLength(2);
    
    // Find chores by name
    const choreWithDesc = result.find(c => c.name === 'Chore with description');
    const choreWithoutDesc = result.find(c => c.name === 'Chore without description');

    expect(choreWithDesc).toBeDefined();
    expect(choreWithDesc!.description).toBe('This chore has a description');
    
    expect(choreWithoutDesc).toBeDefined();
    expect(choreWithoutDesc!.description).toBeNull();
  });

  it('should return proper Chore schema structure', async () => {
    await db.insert(choresTable).values({
      name: 'Test chore',
      description: 'Test description'
    }).execute();

    const result = await getChores();

    expect(result).toHaveLength(1);
    
    const chore = result[0];
    
    // Verify all required fields are present with correct types
    expect(typeof chore.id).toBe('number');
    expect(typeof chore.name).toBe('string');
    expect(chore.description === null || typeof chore.description === 'string').toBe(true);
    expect(chore.created_at).toBeInstanceOf(Date);
    
    // Verify specific values
    expect(chore.name).toBe('Test chore');
    expect(chore.description).toBe('Test description');
  });
});
