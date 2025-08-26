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

  it('should return all chores with correct properties', async () => {
    // Create test chore
    const testDate = new Date('2024-01-15T10:00:00Z');
    await db.insert(choresTable)
      .values({
        name: 'Test Chore',
        is_completed: false,
        assigned_date: testDate
      })
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Test Chore');
    expect(result[0].is_completed).toEqual(false);
    expect(result[0].assigned_date).toBeInstanceOf(Date);
    expect(result[0].assigned_date).toEqual(testDate);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(typeof result[0].id).toBe('number');
  });

  it('should return multiple chores ordered by assigned_date desc, then created_at desc', async () => {
    // Create chores with different assigned dates and creation times
    const today = new Date('2024-01-15T10:00:00Z');
    const yesterday = new Date('2024-01-14T10:00:00Z');
    const tomorrow = new Date('2024-01-16T10:00:00Z');

    // Insert chores in non-chronological order to test sorting
    await db.insert(choresTable)
      .values([
        {
          name: 'Middle Chore',
          is_completed: false,
          assigned_date: today
        },
        {
          name: 'Oldest Chore',
          is_completed: true,
          assigned_date: yesterday
        },
        {
          name: 'Newest Chore',
          is_completed: false,
          assigned_date: tomorrow
        }
      ])
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(3);
    
    // Should be ordered by assigned_date desc
    expect(result[0].name).toEqual('Newest Chore');
    expect(result[0].assigned_date).toEqual(tomorrow);
    
    expect(result[1].name).toEqual('Middle Chore');
    expect(result[1].assigned_date).toEqual(today);
    
    expect(result[2].name).toEqual('Oldest Chore');
    expect(result[2].assigned_date).toEqual(yesterday);
  });

  it('should handle chores with same assigned_date ordered by created_at desc', async () => {
    const sameDate = new Date('2024-01-15T10:00:00Z');

    // Insert first chore
    await db.insert(choresTable)
      .values({
        name: 'First Chore',
        is_completed: false,
        assigned_date: sameDate
      })
      .execute();

    // Small delay to ensure different created_at timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    // Insert second chore
    await db.insert(choresTable)
      .values({
        name: 'Second Chore',
        is_completed: true,
        assigned_date: sameDate
      })
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(2);
    
    // Both have same assigned_date, so should be ordered by created_at desc
    // The second chore should come first (more recent created_at)
    expect(result[0].name).toEqual('Second Chore');
    expect(result[1].name).toEqual('First Chore');
    
    // Verify created_at ordering
    expect(result[0].created_at.getTime()).toBeGreaterThan(result[1].created_at.getTime());
  });

  it('should return chores with different completion statuses', async () => {
    const testDate = new Date('2024-01-15T10:00:00Z');
    
    await db.insert(choresTable)
      .values([
        {
          name: 'Completed Chore',
          is_completed: true,
          assigned_date: testDate
        },
        {
          name: 'Incomplete Chore',
          is_completed: false,
          assigned_date: testDate
        }
      ])
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(2);
    
    // Find chores by name and verify completion status
    const completedChore = result.find(chore => chore.name === 'Completed Chore');
    const incompleteChore = result.find(chore => chore.name === 'Incomplete Chore');
    
    expect(completedChore?.is_completed).toBe(true);
    expect(incompleteChore?.is_completed).toBe(false);
  });

  it('should handle large number of chores efficiently', async () => {
    const baseDate = new Date('2024-01-01T10:00:00Z');
    const choresData = [];

    // Create 50 chores with different dates
    for (let i = 0; i < 50; i++) {
      const assignedDate = new Date(baseDate.getTime() + i * 24 * 60 * 60 * 1000); // Add i days
      choresData.push({
        name: `Chore ${i + 1}`,
        is_completed: i % 2 === 0, // Alternate completion status
        assigned_date: assignedDate
      });
    }

    await db.insert(choresTable)
      .values(choresData)
      .execute();

    const result = await getChores();

    expect(result).toHaveLength(50);
    
    // Verify descending order by assigned_date
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].assigned_date.getTime()).toBeGreaterThanOrEqual(
        result[i].assigned_date.getTime()
      );
    }
    
    // Verify first and last items
    expect(result[0].name).toEqual('Chore 50'); // Most recent assigned_date
    expect(result[49].name).toEqual('Chore 1'); // Oldest assigned_date
  });
});
