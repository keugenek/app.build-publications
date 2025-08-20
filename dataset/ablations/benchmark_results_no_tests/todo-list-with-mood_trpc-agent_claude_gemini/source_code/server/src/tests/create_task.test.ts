import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable, dailyEntriesTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let dailyEntryId: number;

  beforeEach(async () => {
    // Create a daily entry first since tasks require a valid daily_entry_id
    const dailyEntryResult = await db.insert(dailyEntriesTable)
      .values({
        date: '2024-01-15', // Use string format for date column
        mood: 'happy',
        notes: 'Test day',
      })
      .returning()
      .execute();
    
    dailyEntryId = dailyEntryResult[0].id;
  });

  it('should create a task with all fields', async () => {
    const testInput: CreateTaskInput = {
      title: 'Complete project',
      description: 'Finish the daily journal project',
      daily_entry_id: dailyEntryId,
    };

    const result = await createTask(testInput);

    // Verify all fields are set correctly
    expect(result.title).toEqual('Complete project');
    expect(result.description).toEqual('Finish the daily journal project');
    expect(result.is_completed).toBe(false); // Should default to false
    expect(result.daily_entry_id).toEqual(dailyEntryId);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.completed_at).toBeNull(); // Should be null for new tasks
  });

  it('should create a task with null description', async () => {
    const testInput: CreateTaskInput = {
      title: 'Simple task',
      description: null,
      daily_entry_id: dailyEntryId,
    };

    const result = await createTask(testInput);

    expect(result.title).toEqual('Simple task');
    expect(result.description).toBeNull();
    expect(result.is_completed).toBe(false);
    expect(result.daily_entry_id).toEqual(dailyEntryId);
  });

  it('should save task to database correctly', async () => {
    const testInput: CreateTaskInput = {
      title: 'Database test task',
      description: 'Testing database persistence',
      daily_entry_id: dailyEntryId,
    };

    const result = await createTask(testInput);

    // Verify the task was actually saved to the database
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(savedTasks).toHaveLength(1);
    const savedTask = savedTasks[0];
    
    expect(savedTask.title).toEqual('Database test task');
    expect(savedTask.description).toEqual('Testing database persistence');
    expect(savedTask.is_completed).toBe(false);
    expect(savedTask.daily_entry_id).toEqual(dailyEntryId);
    expect(savedTask.created_at).toBeInstanceOf(Date);
    expect(savedTask.completed_at).toBeNull();
  });

  it('should create multiple tasks for the same daily entry', async () => {
    const task1Input: CreateTaskInput = {
      title: 'Task 1',
      description: 'First task',
      daily_entry_id: dailyEntryId,
    };

    const task2Input: CreateTaskInput = {
      title: 'Task 2', 
      description: 'Second task',
      daily_entry_id: dailyEntryId,
    };

    const result1 = await createTask(task1Input);
    const result2 = await createTask(task2Input);

    // Both tasks should be created successfully
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.daily_entry_id).toEqual(dailyEntryId);
    expect(result2.daily_entry_id).toEqual(dailyEntryId);

    // Verify both are in the database
    const allTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.daily_entry_id, dailyEntryId))
      .execute();

    expect(allTasks).toHaveLength(2);
  });

  it('should throw error for invalid daily_entry_id', async () => {
    const testInput: CreateTaskInput = {
      title: 'Invalid task',
      description: 'This should fail',
      daily_entry_id: 99999, // Non-existent daily entry ID
    };

    // Should throw an error due to foreign key constraint
    await expect(createTask(testInput)).rejects.toThrow(/foreign key constraint/i);
  });
});
