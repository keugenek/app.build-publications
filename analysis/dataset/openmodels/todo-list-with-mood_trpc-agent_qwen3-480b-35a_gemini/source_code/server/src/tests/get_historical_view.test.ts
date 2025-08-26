import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, moodEntriesTable } from '../db/schema';
import { getHistoricalView } from '../handlers/get_historical_view';

describe('getHistoricalView', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no data exists', async () => {
    const result = await getHistoricalView();
    expect(result).toEqual([]);
  });

  it('should return historical view with mood entries and task statistics', async () => {
    // Insert some tasks directly
    const taskDate = new Date();
    taskDate.setHours(0, 0, 0, 0);
    taskDate.setMilliseconds(0);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    await db.insert(tasksTable).values([
      { title: 'Task 1', description: 'Description 1', completed: true, created_at: taskDate },
      { title: 'Task 2', description: 'Description 2', completed: true, created_at: taskDate },
      { title: 'Task 3', description: 'Description 3', completed: false, created_at: taskDate }
    ]).execute();
    
    // Insert mood entries
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    const todayStr = today.toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    await db.insert(moodEntriesTable).values([
      { date: todayStr, mood_level: 8, notes: 'Feeling great today!' },
      { date: yesterdayStr, mood_level: 5, notes: 'Just okay' }
    ]).execute();
    
    const result = await getHistoricalView();
    
    // Should have entries for each date that has either tasks or mood entries
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Find today's entry
    const todayEntry = result.find(entry => 
      entry.date.toISOString().split('T')[0] === todayStr
    );
    
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.mood_level).toBe(8);
    expect(todayEntry!.notes).toBe('Feeling great today!');
    expect(todayEntry!.tasks_completed).toBe(2); // 2 completed tasks
    expect(todayEntry!.total_tasks).toBe(3); // 3 total tasks
    
    // Find yesterday's entry
    const yesterdayEntry = result.find(entry => 
      entry.date.toISOString().split('T')[0] === yesterdayStr
    );
    
    expect(yesterdayEntry).toBeDefined();
    expect(yesterdayEntry!.mood_level).toBe(5);
    expect(yesterdayEntry!.notes).toBe('Just okay');
    expect(yesterdayEntry!.tasks_completed).toBe(0); // No completed tasks on this date
    expect(yesterdayEntry!.total_tasks).toBe(0); // No tasks on this date
  });

  it('should handle dates with only tasks but no mood entries', async () => {
    // Insert tasks without mood entries
    const taskDate = new Date();
    taskDate.setHours(0, 0, 0, 0);
    taskDate.setMilliseconds(0);
    const taskDateStr = taskDate.toISOString().split('T')[0];
    
    await db.insert(tasksTable).values([
      { title: 'Task 1', description: 'Description 1', completed: true, created_at: taskDate },
      { title: 'Task 2', description: 'Description 2', completed: false, created_at: taskDate }
    ]).execute();
    
    const result = await getHistoricalView();
    
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Find the entry for the task date
    const taskEntry = result.find(entry => 
      entry.date.toISOString().split('T')[0] === taskDateStr
    );
    
    expect(taskEntry).toBeDefined();
    expect(taskEntry!.mood_level).toBeNull(); // No mood entry
    expect(taskEntry!.notes).toBeNull(); // No notes
    expect(taskEntry!.tasks_completed).toBe(1); // 1 completed task
    expect(taskEntry!.total_tasks).toBe(2); // 2 total tasks
  });

  it('should handle dates with only mood entries but no tasks', async () => {
    // Insert mood entry without tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMilliseconds(0);
    const todayStr = today.toISOString().split('T')[0];
    
    await db.insert(moodEntriesTable).values([
      { date: todayStr, mood_level: 7, notes: 'Pretty good day' }
    ]).execute();
    
    const result = await getHistoricalView();
    
    expect(result.length).toBeGreaterThanOrEqual(1);
    
    // Find today's entry
    const todayEntry = result.find(entry => 
      entry.date.toISOString().split('T')[0] === todayStr
    );
    
    expect(todayEntry).toBeDefined();
    expect(todayEntry!.mood_level).toBe(7);
    expect(todayEntry!.notes).toBe('Pretty good day');
    expect(todayEntry!.tasks_completed).toBe(0); // No tasks
    expect(todayEntry!.total_tasks).toBe(0); // No tasks
  });
});
