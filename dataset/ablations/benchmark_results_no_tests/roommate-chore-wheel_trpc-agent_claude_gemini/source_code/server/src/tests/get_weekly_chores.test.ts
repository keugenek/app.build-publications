import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { choresTable } from '../db/schema';
import { getWeeklyChores } from '../handlers/get_weekly_chores';

describe('getWeeklyChores', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return chores for the current week when no date is provided', async () => {
    // Create test chores for current week
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    
    // Create chores within current week
    await db.insert(choresTable).values([
      {
        name: 'Current Week Chore 1',
        assigned_date: currentWeekStart,
        is_completed: false
      },
      {
        name: 'Current Week Chore 2', 
        assigned_date: new Date(currentWeekStart.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days later
        is_completed: true
      }
    ]).execute();

    // Create chore from previous week (should not be included)
    const previousWeek = new Date(currentWeekStart);
    previousWeek.setDate(previousWeek.getDate() - 7);
    await db.insert(choresTable).values({
      name: 'Previous Week Chore',
      assigned_date: previousWeek,
      is_completed: false
    }).execute();

    const result = await getWeeklyChores();

    expect(result).toHaveLength(2);
    expect(result.map(c => c.name).sort()).toEqual(['Current Week Chore 1', 'Current Week Chore 2']);
    
    // Verify all chores are within current week
    result.forEach(chore => {
      expect(chore.assigned_date).toBeInstanceOf(Date);
      expect(chore.assigned_date >= currentWeekStart).toBe(true);
    });
  });

  it('should return chores for a specific week when date is provided', async () => {
    // Set up specific week start date (Monday, January 8, 2024)
    const specificWeekStart = new Date('2024-01-08T00:00:00.000Z');
    
    // Create chores for the specific week
    await db.insert(choresTable).values([
      {
        name: 'Specific Week Chore 1',
        assigned_date: specificWeekStart,
        is_completed: false
      },
      {
        name: 'Specific Week Chore 2',
        assigned_date: new Date('2024-01-10T12:00:00.000Z'), // Wednesday of same week
        is_completed: true
      },
      {
        name: 'Specific Week Chore 3',
        assigned_date: new Date('2024-01-14T23:59:59.999Z'), // Sunday end of week
        is_completed: false
      }
    ]).execute();

    // Create chore from different week (should not be included)
    await db.insert(choresTable).values({
      name: 'Different Week Chore',
      assigned_date: new Date('2024-01-15T00:00:00.000Z'), // Monday of next week
      is_completed: false
    }).execute();

    const result = await getWeeklyChores(specificWeekStart);

    expect(result).toHaveLength(3);
    expect(result.map(c => c.name).sort()).toEqual([
      'Specific Week Chore 1',
      'Specific Week Chore 2', 
      'Specific Week Chore 3'
    ]);

    // Verify all chores are within the specified week
    const weekEnd = new Date(specificWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    result.forEach(chore => {
      expect(chore.assigned_date).toBeInstanceOf(Date);
      expect(chore.assigned_date >= specificWeekStart).toBe(true);
      expect(chore.assigned_date <= weekEnd).toBe(true);
    });
  });

  it('should return empty array when no chores exist for the week', async () => {
    // Use a week far in the future with no chores
    const futureWeekStart = new Date('2025-12-01T00:00:00.000Z');
    
    const result = await getWeeklyChores(futureWeekStart);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle week boundaries correctly', async () => {
    // Test chores right at week boundaries
    const weekStart = new Date('2024-01-08T00:00:00.000Z'); // Monday
    const weekEnd = new Date('2024-01-14T23:59:59.999Z'); // Sunday end
    const nextWeekStart = new Date('2024-01-15T00:00:00.000Z'); // Next Monday

    await db.insert(choresTable).values([
      {
        name: 'Start of Week',
        assigned_date: weekStart,
        is_completed: false
      },
      {
        name: 'End of Week',
        assigned_date: weekEnd,
        is_completed: true
      },
      {
        name: 'Next Week Start',
        assigned_date: nextWeekStart,
        is_completed: false
      }
    ]).execute();

    const result = await getWeeklyChores(weekStart);

    expect(result).toHaveLength(2);
    expect(result.map(c => c.name).sort()).toEqual(['End of Week', 'Start of Week']);
    
    // Verify the next week chore is not included
    expect(result.find(c => c.name === 'Next Week Start')).toBeUndefined();
  });

  it('should preserve all chore properties correctly', async () => {
    const weekStart = new Date('2024-01-08T00:00:00.000Z');
    
    await db.insert(choresTable).values({
      name: 'Test Chore Properties',
      assigned_date: weekStart,
      is_completed: true
    }).execute();

    const result = await getWeeklyChores(weekStart);

    expect(result).toHaveLength(1);
    const chore = result[0];
    
    expect(chore.id).toBeDefined();
    expect(typeof chore.id).toBe('number');
    expect(chore.name).toBe('Test Chore Properties');
    expect(chore.is_completed).toBe(true);
    expect(chore.assigned_date).toBeInstanceOf(Date);
    expect(chore.created_at).toBeInstanceOf(Date);
  });

  it('should handle different days of the week as input correctly', async () => {
    // Create chores for a specific week
    const mondayStart = new Date('2024-01-08T00:00:00.000Z'); // Monday
    await db.insert(choresTable).values({
      name: 'Week Chore',
      assigned_date: mondayStart,
      is_completed: false
    }).execute();

    // Test calling with different days of the same week
    const tuesday = new Date('2024-01-09T15:30:00.000Z'); // Tuesday of same week
    const friday = new Date('2024-01-12T09:00:00.000Z'); // Friday of same week
    const sunday = new Date('2024-01-14T20:00:00.000Z'); // Sunday of same week

    const resultTuesday = await getWeeklyChores(tuesday);
    const resultFriday = await getWeeklyChores(friday);
    const resultSunday = await getWeeklyChores(sunday);

    // All should return the same chore since they're in the same week
    expect(resultTuesday).toHaveLength(1);
    expect(resultFriday).toHaveLength(1);
    expect(resultSunday).toHaveLength(1);
    
    expect(resultTuesday[0].name).toBe('Week Chore');
    expect(resultFriday[0].name).toBe('Week Chore');
    expect(resultSunday[0].name).toBe('Week Chore');
  });
});

// Helper function to get the start of the week (Monday) - same as in handler
function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const dayOfWeek = weekStart.getDay();
  
  // Calculate days to subtract to get to Monday (day 1)
  // If Sunday (0), subtract 6 days; otherwise subtract (dayOfWeek - 1)
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  weekStart.setDate(weekStart.getDate() - daysToSubtract);
  weekStart.setHours(0, 0, 0, 0); // Start of day
  
  return weekStart;
}
