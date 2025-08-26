import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodsTable } from '../db/schema';
import { getJournalEntries } from '../handlers/get_journal_entries';
import { eq, sql } from 'drizzle-orm';

describe('getJournalEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no data exists', async () => {
    const result = await getJournalEntries();
    expect(result).toEqual([]);
  });

  it('should return journal entries with tasks and moods grouped by date', async () => {
    // Create test data
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Create tasks for today
    const [task1] = await db.insert(tasksTable).values({
      title: 'Task 1',
      description: 'Description 1',
      completed: false
    }).returning();

    const [task2] = await db.insert(tasksTable).values({
      title: 'Task 2',
      description: 'Description 2',
      completed: true
    }).returning();

    // Create a task for yesterday
    await db.insert(tasksTable).values({
      title: 'Yesterday Task',
      description: 'Yesterday Description',
      completed: false,
      created_at: yesterday,
      updated_at: yesterday
    }).execute();

    // Log mood for today
    const [mood1] = await db.insert(moodsTable).values({
      mood: 4,
      description: 'Feeling good'
    }).returning();

    // Log mood for yesterday
    await db.insert(moodsTable).values({
      mood: 3,
      description: 'Okay day',
      created_at: yesterday
    }).execute();

    // Get journal entries
    const entries = await getJournalEntries();

    // Should have 2 entries (today and yesterday)
    expect(entries).toHaveLength(2);

    // Check today's entry
    const todayEntry = entries.find(entry => 
      entry.date.toDateString() === today.toDateString()
    );
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.tasks).toHaveLength(2);
    expect(todayEntry!.tasks.some(t => t.id === task1.id)).toBe(true);
    expect(todayEntry!.tasks.some(t => t.id === task2.id)).toBe(true);
    expect(todayEntry!.mood).toBeDefined();
    expect(todayEntry!.mood!.id).toBe(mood1.id);

    // Check yesterday's entry
    const yesterdayEntry = entries.find(entry => 
      entry.date.toDateString() === yesterday.toDateString()
    );
    expect(yesterdayEntry).toBeDefined();
    expect(yesterdayEntry!.tasks).toHaveLength(1);
    expect(yesterdayEntry!.mood).toBeDefined();
    expect(yesterdayEntry!.mood!.mood).toBe(3);
  });

  it('should handle entries with only tasks and no mood', async () => {
    const today = new Date();

    // Create a task but no mood
    await db.insert(tasksTable).values({
      title: 'Task without mood',
      description: 'Task description',
      completed: false
    }).execute();

    const entries = await getJournalEntries();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.date.toDateString()).toBe(today.toDateString());
    expect(entry.tasks).toHaveLength(1);
    expect(entry.mood).toBeNull();
  });

  it('should handle entries with only mood and no tasks', async () => {
    const today = new Date();

    // Log a mood but create no tasks
    await db.insert(moodsTable).values({
      mood: 5,
      description: 'Amazing day!'
    }).execute();

    const entries = await getJournalEntries();

    expect(entries).toHaveLength(1);
    const entry = entries[0];
    expect(entry.date.toDateString()).toBe(today.toDateString());
    expect(entry.tasks).toHaveLength(0);
    expect(entry.mood).toBeDefined();
    expect(entry.mood!.mood).toBe(5);
  });

  it('should return entries sorted by date descending', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create data for three different dates
    await db.insert(moodsTable).values({
      mood: 3,
      description: 'Two days ago',
      created_at: twoDaysAgo
    }).execute();

    await db.insert(moodsTable).values({
      mood: 4,
      description: 'Yesterday',
      created_at: yesterday
    }).execute();

    await db.insert(moodsTable).values({
      mood: 5,
      description: 'Today'
    }).execute();

    const entries = await getJournalEntries();

    expect(entries).toHaveLength(3);
    
    // Check that entries are sorted by date descending
    expect(entries[0].date.toDateString()).toBe(today.toDateString());
    expect(entries[1].date.toDateString()).toBe(yesterday.toDateString());
    expect(entries[2].date.toDateString()).toBe(twoDaysAgo.toDateString());
  });
});
