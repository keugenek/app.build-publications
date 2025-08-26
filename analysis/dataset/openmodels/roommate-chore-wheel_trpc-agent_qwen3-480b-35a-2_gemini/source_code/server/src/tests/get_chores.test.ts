import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { getChores } from '../handlers/get_chores';

describe('getChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no chores exist', async () => {
    const result = await getChores();
    expect(result).toEqual([]);
  });

  it('should return all chores when chores exist', async () => {
    // Insert test data
    const choreData = [
      {
        name: 'Vacuum living room',
        description: 'Vacuum the main living area'
      },
      {
        name: 'Take out trash',
        description: 'Empty all trash bins'
      },
      {
        name: 'Clean bathroom',
        description: 'Scrub toilet, sink, and shower'
      }
    ];

    // Insert chores into database
    for (const chore of choreData) {
      await db.insert(choresTable)
        .values(chore)
        .execute();
    }

    // Fetch chores
    const result = await getChores();

    // Check that we got the right number of chores
    expect(result).toHaveLength(3);

    // Check that each chore has the expected properties
    const choreNames = result.map(chore => chore.name);
    expect(choreNames).toContain('Vacuum living room');
    expect(choreNames).toContain('Take out trash');
    expect(choreNames).toContain('Clean bathroom');

    // Check that all required fields are present
    result.forEach(chore => {
      expect(chore).toHaveProperty('id');
      expect(chore).toHaveProperty('name');
      expect(chore).toHaveProperty('description');
      expect(chore).toHaveProperty('created_at');
      expect(typeof chore.id).toBe('number');
      expect(typeof chore.name).toBe('string');
      expect(chore.created_at).toBeInstanceOf(Date);
    });
  });

  it('should handle chores with null descriptions', async () => {
    // Insert chore with null description
    await db.insert(choresTable)
      .values({
        name: 'Test chore',
        description: null
      })
      .execute();

    const result = await getChores();
    
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test chore');
    expect(result[0].description).toBeNull();
  });
});
