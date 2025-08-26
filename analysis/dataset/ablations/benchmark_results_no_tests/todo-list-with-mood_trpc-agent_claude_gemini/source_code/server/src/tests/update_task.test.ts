import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyEntriesTable, tasksTable } from '../db/schema';
import { type UpdateTaskInput, type CreateDailyEntryInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Test data setup
const testDailyEntry: CreateDailyEntryInput = {
  date: new Date('2024-01-15'),
  mood: 'neutral',
  notes: 'Test entry for tasks'
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a daily entry and task for testing
  const createTestTask = async (title: string = 'Original Task') => {
    // Create daily entry first
    const [dailyEntry] = await db.insert(dailyEntriesTable)
      .values({
        date: testDailyEntry.date.toISOString().split('T')[0], // Convert to date string
        mood: testDailyEntry.mood,
        notes: testDailyEntry.notes,
        updated_at: new Date()
      })
      .returning()
      .execute();

    // Create task
    const [task] = await db.insert(tasksTable)
      .values({
        title,
        description: 'Original description',
        is_completed: false,
        daily_entry_id: dailyEntry.id
      })
      .returning()
      .execute();

    return task;
  };

  it('should update task title', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Updated Task Title'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.is_completed).toEqual(false); // Should remain unchanged
    expect(result.completed_at).toBeNull(); // Should remain null
    expect(result.daily_entry_id).toEqual(originalTask.daily_entry_id);
  });

  it('should update task description', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('Original Task'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.is_completed).toEqual(false); // Should remain unchanged
    expect(result.completed_at).toBeNull(); // Should remain null
  });

  it('should update task description to null', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: null
    };

    const result = await updateTask(updateInput);

    expect(result.description).toBeNull();
  });

  it('should mark task as completed and set completed_at timestamp', async () => {
    const originalTask = await createTestTask();
    const beforeUpdate = new Date();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.completed_at!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should mark task as incomplete and clear completed_at timestamp', async () => {
    const originalTask = await createTestTask();
    
    // First, mark it as completed
    await updateTask({
      id: originalTask.id,
      is_completed: true
    });

    // Then mark it as incomplete
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      is_completed: false
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.is_completed).toEqual(false);
    expect(result.completed_at).toBeNull();
  });

  it('should update multiple fields at once', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'New Title',
      description: 'New description',
      is_completed: true
    };

    const result = await updateTask(updateInput);

    expect(result.id).toEqual(originalTask.id);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.is_completed).toEqual(true);
    expect(result.completed_at).toBeInstanceOf(Date);
    expect(result.daily_entry_id).toEqual(originalTask.daily_entry_id);
  });

  it('should persist changes to database', async () => {
    const originalTask = await createTestTask();
    
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      title: 'Persisted Title',
      is_completed: true
    };

    await updateTask(updateInput);

    // Query the database directly to verify changes were persisted
    const [persistedTask] = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, originalTask.id))
      .execute();

    expect(persistedTask.title).toEqual('Persisted Title');
    expect(persistedTask.is_completed).toEqual(true);
    expect(persistedTask.completed_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'Should fail'
    };

    expect(updateTask(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should preserve unchanged fields', async () => {
    const originalTask = await createTestTask('Preserve Me');
    
    // Only update description, leaving other fields unchanged
    const updateInput: UpdateTaskInput = {
      id: originalTask.id,
      description: 'Only this should change'
    };

    const result = await updateTask(updateInput);

    expect(result.title).toEqual('Preserve Me'); // Should remain unchanged
    expect(result.description).toEqual('Only this should change');
    expect(result.is_completed).toEqual(false); // Should remain unchanged
    expect(result.completed_at).toBeNull(); // Should remain null
    expect(result.created_at).toBeInstanceOf(Date); // Should remain from original
    expect(result.daily_entry_id).toEqual(originalTask.daily_entry_id); // Should remain unchanged
  });
});
