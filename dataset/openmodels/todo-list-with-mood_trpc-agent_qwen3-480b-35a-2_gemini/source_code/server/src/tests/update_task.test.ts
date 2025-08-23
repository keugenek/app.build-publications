import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a task for testing
const createTestTask = async (overrides = {}) => {
  const defaultTask = {
    title: 'Test Task',
    description: 'A task for testing',
    due_date: new Date('2023-12-31')
  };
  
  const taskData = { ...defaultTask, ...overrides };
  return await db.insert(tasksTable)
    .values(taskData)
    .returning()
    .execute()
    .then(result => result[0]);
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a task title', async () => {
    // Create a task first
    const task = await createTestTask();
    
    // Update the task
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Updated Task Title'
    };
    
    const result = await updateTask(updateInput);
    
    // Check the returned result
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Updated Task Title');
    expect(result.description).toEqual(task.description);
    expect(result.completed).toEqual(task.completed);
    
    // Check that the due_date and created_at are Date objects
    expect(result.due_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify it was actually updated in the database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute()
      .then(result => result[0]);
      
    expect(dbTask.title).toEqual('Updated Task Title');
    expect(dbTask.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields of a task', async () => {
    // Create a task first
    const task = await createTestTask();
    
    // Update multiple fields
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'Completely Updated Task',
      description: 'This task has been completely updated',
      completed: true
    };
    
    const result = await updateTask(updateInput);
    
    // Check the returned result
    expect(result.id).toEqual(task.id);
    expect(result.title).toEqual('Completely Updated Task');
    expect(result.description).toEqual('This task has been completely updated');
    expect(result.completed).toEqual(true);
    
    // Verify in database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute()
      .then(result => result[0]);
      
    expect(dbTask.title).toEqual('Completely Updated Task');
    expect(dbTask.description).toEqual('This task has been completely updated');
    expect(dbTask.completed).toEqual(true);
  });

  it('should update the due_date of a task', async () => {
    // Create a task first
    const task = await createTestTask();
    
    const newDueDate = new Date('2024-01-15');
    const updateInput: UpdateTaskInput = {
      id: task.id,
      due_date: newDueDate
    };
    
    const result = await updateTask(updateInput);
    
    // Check the returned result
    expect(result.due_date).toEqual(newDueDate);
    
    // Verify in database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute()
      .then(result => result[0]);
      
    expect(new Date(dbTask.due_date)).toEqual(newDueDate);
  });

  it('should throw an error when trying to update a non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };
    
    await expect(updateTask(updateInput)).rejects.toThrow(/Task with id 99999 not found/);
  });

  it('should update the updated_at timestamp when modifying a task', async () => {
    // Create a task first
    const task = await createTestTask();
    
    // Store the original updated_at time
    const originalUpdatedAt = new Date(task.updated_at);
    
    // Wait a bit to ensure time has passed
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // Update the task
    const updateInput: UpdateTaskInput = {
      id: task.id,
      title: 'New Title'
    };
    
    const result = await updateTask(updateInput);
    
    // Check that updated_at has been updated
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    
    // Verify in database
    const dbTask = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, task.id))
      .execute()
      .then(result => result[0]);
      
    expect(new Date(dbTask.updated_at).getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });
});
