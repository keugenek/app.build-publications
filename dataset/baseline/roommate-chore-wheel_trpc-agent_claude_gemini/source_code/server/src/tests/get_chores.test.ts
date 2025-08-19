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

  it('should return all chores', async () => {
    // Create test chores
    await db.insert(choresTable)
      .values([
        { name: 'Wash dishes' },
        { name: 'Take out trash' },
        { name: 'Vacuum living room' }
      ])
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Verify structure and data
    const choreNames = result.map(chore => chore.name);
    expect(choreNames).toContain('Wash dishes');
    expect(choreNames).toContain('Take out trash');
    expect(choreNames).toContain('Vacuum living room');
    
    // Verify all required fields are present
    result.forEach(chore => {
      expect(chore.id).toBeDefined();
      expect(typeof chore.id).toBe('number');
      expect(chore.name).toBeDefined();
      expect(typeof chore.name).toBe('string');
      expect(chore.created_at).toBeInstanceOf(Date);
    });
  });

  it('should return chores ordered by creation time', async () => {
    // Create chores with slight delay to ensure different timestamps
    await db.insert(choresTable)
      .values({ name: 'First chore' })
      .execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(choresTable)
      .values({ name: 'Second chore' })
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('First chore');
    expect(result[1].name).toBe('Second chore');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });

  it('should handle database with single chore', async () => {
    await db.insert(choresTable)
      .values({ name: 'Only chore' })
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Only chore');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
