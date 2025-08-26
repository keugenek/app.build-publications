import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodLogsTable } from '../db/schema';
import { getHistory } from '../handlers/get_history';
import { sql } from 'drizzle-orm';

describe('getHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no data exists', async () => {
    const result = await getHistory();
    expect(result).toEqual([]);
  });

  it('should return history records with completed tasks and mood logs', async () => {
    // Create test tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        due_date: new Date('2023-01-15'),
        completed: true,
        created_at: new Date('2023-01-15'),
        updated_at: new Date('2023-01-15')
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        due_date: new Date('2023-01-16'),
        completed: true,
        created_at: new Date('2023-01-16'),
        updated_at: new Date('2023-01-16')
      })
      .returning()
      .execute();

    // Create a non-completed task (should not appear in history)
    await db.insert(tasksTable)
      .values({
        title: 'Task 3',
        description: 'Incomplete task',
        due_date: new Date('2023-01-17'),
        completed: false
      })
      .execute();

    // Create mood logs
    const moodLog1 = await db.insert(moodLogsTable)
      .values({
        mood: 'Happy',
        note: 'Feeling great!',
        logged_at: new Date('2023-01-15')
      })
      .returning()
      .execute();

    const moodLog2 = await db.insert(moodLogsTable)
      .values({
        mood: 'Sad',
        note: 'Not feeling well',
        logged_at: new Date('2023-01-16')
      })
      .returning()
      .execute();

    const result = await getHistory();

    // Should have records for each day with data
    expect(result.length).toBeGreaterThan(0);

    // Verify structure
    result.forEach(record => {
      expect(record).toHaveProperty('date');
      expect(record).toHaveProperty('tasksCompleted');
      expect(record).toHaveProperty('moodLogs');
      expect(record.date).toBeInstanceOf(Date);
      expect(Array.isArray(record.tasksCompleted)).toBe(true);
      expect(Array.isArray(record.moodLogs)).toBe(true);
    });

    // Find the record with task1 and verify
    const task1DateRecord = result.find(r => 
      r.tasksCompleted.some(t => t.id === task1[0].id)
    );
    expect(task1DateRecord).toBeDefined();
    expect(task1DateRecord?.tasksCompleted).toHaveLength(1);
    expect(task1DateRecord?.tasksCompleted[0].title).toBe('Task 1');

    // Find the record with mood logs and verify
    const moodLogDateRecord = result.find(r => 
      r.moodLogs.some(m => m.id === moodLog1[0].id)
    );
    expect(moodLogDateRecord).toBeDefined();
    expect(moodLogDateRecord?.moodLogs.length).toBeGreaterThanOrEqual(1);
  });

  it('should group tasks and mood logs by date correctly', async () => {
    // Create tasks for the same date
    const date = new Date();
    
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task',
        due_date: date,
        completed: true
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task',
        due_date: date,
        completed: true
      })
      .returning()
      .execute();

    // Create mood logs for the same date
    const moodLog1 = await db.insert(moodLogsTable)
      .values({
        mood: 'Happy',
        note: 'Feeling great!'
      })
      .returning()
      .execute();

    const moodLog2 = await db.insert(moodLogsTable)
      .values({
        mood: 'Excited',
        note: 'Excited about progress'
      })
      .returning()
      .execute();

    const result = await getHistory();

    // Find the record for today
    const todayRecord = result.find(r => 
      r.date.toDateString() === date.toDateString()
    );

    expect(todayRecord).toBeDefined();
    expect(todayRecord?.tasksCompleted).toHaveLength(2);
    expect(todayRecord?.moodLogs).toHaveLength(2);
    
    // Verify task data
    const taskIds = todayRecord?.tasksCompleted.map(t => t.id);
    expect(taskIds).toContain(task1[0].id);
    expect(taskIds).toContain(task2[0].id);
    
    // Verify mood log data
    const moodLogIds = todayRecord?.moodLogs.map(m => m.id);
    expect(moodLogIds).toContain(moodLog1[0].id);
    expect(moodLogIds).toContain(moodLog2[0].id);
  });
});
