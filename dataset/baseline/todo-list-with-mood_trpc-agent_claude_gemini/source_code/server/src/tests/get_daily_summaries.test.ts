import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { type DateRangeInput } from '../schema';
import { getDailySummaries } from '../handlers/get_daily_summaries';

describe('getDailySummaries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no data exists', async () => {
    const result = await getDailySummaries();
    expect(result).toEqual([]);
  });

  it('should return summaries with tasks and mood entries', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create tasks for today
    await db.insert(tasksTable).values([
      {
        title: 'Complete project',
        description: 'Finish the final presentation',
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Review code',
        description: null,
        is_completed: false,
        created_at: today,
      },
    ]).execute();

    // Create tasks for yesterday
    await db.insert(tasksTable).values([
      {
        title: 'Write tests',
        description: 'Add unit tests',
        is_completed: true,
        created_at: yesterday,
        completed_at: yesterday,
      },
    ]).execute();

    // Create mood entries
    await db.insert(moodEntriesTable).values([
      {
        mood_rating: 4,
        note: 'Great day!',
        date: today.toISOString().split('T')[0],
        created_at: today,
      },
      {
        mood_rating: 3,
        note: 'Average day',
        date: yesterday.toISOString().split('T')[0],
        created_at: yesterday,
      },
    ]).execute();

    const result = await getDailySummaries();

    expect(result).toHaveLength(2);
    
    // Check that results are ordered by date (newest first)
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
    expect(result[1].date.toDateString()).toEqual(yesterday.toDateString());

    // Check today's summary
    const todaySummary = result[0];
    expect(todaySummary.total_tasks).toEqual(2);
    expect(todaySummary.completed_tasks_count).toEqual(1);
    expect(todaySummary.completed_tasks).toHaveLength(1);
    expect(todaySummary.completed_tasks[0].title).toEqual('Complete project');
    expect(todaySummary.mood_entry).toBeDefined();
    expect(todaySummary.mood_entry!.mood_rating).toEqual(4);
    expect(todaySummary.mood_entry!.note).toEqual('Great day!');

    // Check yesterday's summary
    const yesterdaySummary = result[1];
    expect(yesterdaySummary.total_tasks).toEqual(1);
    expect(yesterdaySummary.completed_tasks_count).toEqual(1);
    expect(yesterdaySummary.completed_tasks).toHaveLength(1);
    expect(yesterdaySummary.completed_tasks[0].title).toEqual('Write tests');
    expect(yesterdaySummary.mood_entry).toBeDefined();
    expect(yesterdaySummary.mood_entry!.mood_rating).toEqual(3);
  });

  it('should filter by date range correctly', async () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Create tasks across different dates
    await db.insert(tasksTable).values([
      {
        title: 'Recent task',
        description: null,
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Medium old task',
        description: null,
        is_completed: false,
        created_at: fiveDaysAgo,
      },
      {
        title: 'Very old task',
        description: null,
        is_completed: true,
        created_at: tenDaysAgo,
        completed_at: tenDaysAgo,
      },
    ]).execute();

    // Test with specific date range
    const dateRange: DateRangeInput = {
      start_date: fiveDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };

    const result = await getDailySummaries(dateRange);

    expect(result).toHaveLength(2);
    
    // Should include today and five days ago, but not ten days ago
    const dates = result.map(summary => summary.date.toDateString());
    expect(dates).toContain(today.toDateString());
    expect(dates).toContain(fiveDaysAgo.toDateString());
    expect(dates).not.toContain(tenDaysAgo.toDateString());
  });

  it('should return summaries for days with only mood entries', async () => {
    const today = new Date();

    // Create only mood entry, no tasks
    await db.insert(moodEntriesTable).values({
      mood_rating: 5,
      note: 'Mood only day',
      date: today.toISOString().split('T')[0],
      created_at: today,
    }).execute();

    const result = await getDailySummaries();

    expect(result).toHaveLength(1);
    expect(result[0].total_tasks).toEqual(0);
    expect(result[0].completed_tasks_count).toEqual(0);
    expect(result[0].completed_tasks).toHaveLength(0);
    expect(result[0].mood_entry).toBeDefined();
    expect(result[0].mood_entry!.mood_rating).toEqual(5);
  });

  it('should return summaries for days with only tasks', async () => {
    const today = new Date();

    // Create only tasks, no mood entry
    await db.insert(tasksTable).values([
      {
        title: 'Solo task',
        description: 'A task without mood',
        is_completed: false,
        created_at: today,
      },
    ]).execute();

    const result = await getDailySummaries();

    expect(result).toHaveLength(1);
    expect(result[0].total_tasks).toEqual(1);
    expect(result[0].completed_tasks_count).toEqual(0);
    expect(result[0].completed_tasks).toHaveLength(0);
    expect(result[0].mood_entry).toBeNull();
  });

  it('should handle multiple completed tasks on same day', async () => {
    const today = new Date();

    // Create multiple completed tasks
    await db.insert(tasksTable).values([
      {
        title: 'Task 1',
        description: 'First completed task',
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Task 2',
        description: 'Second completed task',
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Task 3',
        description: 'Incomplete task',
        is_completed: false,
        created_at: today,
      },
    ]).execute();

    const result = await getDailySummaries();

    expect(result).toHaveLength(1);
    expect(result[0].total_tasks).toEqual(3);
    expect(result[0].completed_tasks_count).toEqual(2);
    expect(result[0].completed_tasks).toHaveLength(2);
    
    // Verify all completed tasks are included
    const completedTitles = result[0].completed_tasks.map(task => task.title);
    expect(completedTitles).toContain('Task 1');
    expect(completedTitles).toContain('Task 2');
    expect(completedTitles).not.toContain('Task 3');
  });

  it('should handle date range with start date only', async () => {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Create tasks across different dates
    await db.insert(tasksTable).values([
      {
        title: 'Recent task',
        description: null,
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Old task',
        description: null,
        is_completed: false,
        created_at: weekAgo,
      },
    ]).execute();

    // Filter from 3 days ago to present
    const dateRange: DateRangeInput = {
      start_date: threeDaysAgo.toISOString().split('T')[0],
    };

    const result = await getDailySummaries(dateRange);

    expect(result).toHaveLength(1);
    expect(result[0].date.toDateString()).toEqual(today.toDateString());
  });

  it('should handle date range with end date only', async () => {
    const today = new Date();
    const fiveDaysAgo = new Date(today);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    // Create tasks across different dates
    await db.insert(tasksTable).values([
      {
        title: 'Recent task',
        description: null,
        is_completed: true,
        created_at: today,
        completed_at: today,
      },
      {
        title: 'Old task within range',
        description: null,
        is_completed: false,
        created_at: tenDaysAgo,
      },
    ]).execute();

    // Filter up to 5 days ago (should use default 30-day lookback from end date)
    const dateRange: DateRangeInput = {
      end_date: fiveDaysAgo.toISOString().split('T')[0],
    };

    const result = await getDailySummaries(dateRange);

    // Should not include today's task, but should include the 10-day-old task
    // since it falls within 30 days before the end date
    expect(result).toHaveLength(1);
    expect(result[0].date.toDateString()).toEqual(tenDaysAgo.toDateString());
  });
});
