import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { getChores } from '../handlers/get_chores';
import { eq } from 'drizzle-orm';

describe('getChores', () => {
  beforeEach(async () => {
    await createDB();
    
    // Insert test data
    await db.insert(choresTable).values([
      { name: 'Wash dishes', description: 'Clean all dishes after meals' },
      { name: 'Vacuum living room', description: 'Vacuum the main living area' },
      { name: 'Take out trash', description: null }
    ]).execute();
  });
  
  afterEach(resetDB);

  it('should fetch all chores from the database', async () => {
    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Check that we got the expected chores
    const choreNames = result.map(chore => chore.name);
    expect(choreNames).toContain('Wash dishes');
    expect(choreNames).toContain('Vacuum living room');
    expect(choreNames).toContain('Take out trash');
    
    // Verify structure of returned chores
    const dishChore = result.find(chore => chore.name === 'Wash dishes');
    expect(dishChore).toBeDefined();
    expect(dishChore?.description).toBe('Clean all dishes after meals');
    expect(dishChore?.created_at).toBeInstanceOf(Date);
    expect(dishChore?.id).toBeDefined();
  });

  it('should return an empty array when no chores exist', async () => {
    // Clear the table
    await db.delete(choresTable).execute();
    
    const result = await getChores();
    
    expect(result).toHaveLength(0);
    expect(result).toEqual([]);
  });

  it('should preserve chore properties correctly', async () => {
    const result = await getChores();
    
    // Check that all required properties are present
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
});
