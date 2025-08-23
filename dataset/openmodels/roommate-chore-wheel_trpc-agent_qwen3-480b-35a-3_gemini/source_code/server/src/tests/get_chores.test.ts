import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { getChores } from '../handlers/get_chores';

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
    const chores = await getChores();

    expect(chores).toHaveLength(3);
    
    // Check first chore
    expect(chores[0]).toEqual({
      id: expect.any(Number),
      name: 'Wash dishes',
      description: 'Clean all dishes after meals',
      created_at: expect.any(Date)
    });
    
    // Check second chore
    expect(chores[1]).toEqual({
      id: expect.any(Number),
      name: 'Vacuum living room',
      description: 'Vacuum the main living area',
      created_at: expect.any(Date)
    });
    
    // Check chore with null description
    expect(chores[2]).toEqual({
      id: expect.any(Number),
      name: 'Take out trash',
      description: null,
      created_at: expect.any(Date)
    });
  });

  it('should return an empty array when no chores exist', async () => {
    // Clear the database
    await resetDB();
    await createDB();

    const chores = await getChores();
    expect(chores).toHaveLength(0);
  });

  it('should properly handle Date objects', async () => {
    const chores = await getChores();
    
    expect(chores).toHaveLength(3);
    chores.forEach(chore => {
      expect(chore.created_at).toBeInstanceOf(Date);
      expect(typeof chore.id).toBe('number');
      expect(typeof chore.name).toBe('string');
      expect(chore.description === null || typeof chore.description === 'string').toBe(true);
    });
  });
});
