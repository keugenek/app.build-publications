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
  });

  it('should return all chores from database', async () => {
    // Insert test chores
    await db.insert(choresTable).values([
      {
        name: 'Vacuum living room',
        description: 'Vacuum all carpeted areas in the living room'
      },
      {
        name: 'Take out trash',
        description: 'Empty all trash bins and take bags to curb'
      },
      {
        name: 'Clean bathroom',
        description: null // Test nullable description
      }
    ]).execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Sort by name for consistent testing
    const sortedResult = result.sort((a, b) => a.name.localeCompare(b.name));
    
    expect(sortedResult[0]).toMatchObject({
      name: 'Clean bathroom',
      description: null
    });
    expect(sortedResult[0].id).toBeDefined();
    expect(sortedResult[0].created_at).toBeInstanceOf(Date);

    expect(sortedResult[1]).toMatchObject({
      name: 'Take out trash',
      description: 'Empty all trash bins and take bags to curb'
    });
    expect(sortedResult[1].id).toBeDefined();
    expect(sortedResult[1].created_at).toBeInstanceOf(Date);

    expect(sortedResult[2]).toMatchObject({
      name: 'Vacuum living room',
      description: 'Vacuum all carpeted areas in the living room'
    });
    expect(sortedResult[2].id).toBeDefined();
    expect(sortedResult[2].created_at).toBeInstanceOf(Date);
  });

  it('should return chores with all required fields', async () => {
    // Insert a single test chore
    await db.insert(choresTable).values({
      name: 'Wash dishes',
      description: 'Clean all dirty dishes and utensils'
    }).execute();

    const result = await getChores();

    expect(result).toHaveLength(1);
    
    const chore = result[0];
    expect(chore.id).toBeTypeOf('number');
    expect(chore.name).toBe('Wash dishes');
    expect(chore.description).toBe('Clean all dirty dishes and utensils');
    expect(chore.created_at).toBeInstanceOf(Date);
  });

  it('should handle multiple chores with mixed descriptions', async () => {
    // Insert chores with various description scenarios
    await db.insert(choresTable).values([
      {
        name: 'Mow lawn',
        description: 'Cut grass in front and back yard'
      },
      {
        name: 'Do laundry',
        description: ''
      },
      {
        name: 'Water plants',
        description: null
      }
    ]).execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Verify each chore has proper structure
    result.forEach(chore => {
      expect(chore.id).toBeTypeOf('number');
      expect(chore.name).toBeTypeOf('string');
      expect(chore.name.length).toBeGreaterThan(0);
      expect(chore.created_at).toBeInstanceOf(Date);
      // description can be string or null
      expect(chore.description === null || typeof chore.description === 'string').toBe(true);
    });
  });
});
