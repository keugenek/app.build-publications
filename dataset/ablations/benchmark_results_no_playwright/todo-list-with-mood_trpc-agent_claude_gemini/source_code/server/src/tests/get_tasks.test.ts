import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { getTasks } from '../handlers/get_tasks';

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();
    expect(result).toEqual([]);
  });

  it('should return all tasks', async () => {
    // Insert test tasks
    await db.insert(tasksTable)
      .values([
        { description: 'First task', completed: false },
        { description: 'Second task', completed: true },
        { description: 'Third task', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].description).toBe('First task');
    expect(result[1].description).toBe('Second task');
    expect(result[2].description).toBe('Third task');
    
    // Verify all required fields are present
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.description).toBeDefined();
      expect(typeof task.completed).toBe('boolean');
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
      expect(task.completed_at).toBeNull(); // All test tasks have null completed_at
    });
  });

  it('should return tasks ordered by created_at descending (newest first)', async () => {
    // Insert tasks with slight delay to ensure different timestamps
    await db.insert(tasksTable)
      .values({ description: 'Oldest task', completed: false })
      .execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(tasksTable)
      .values({ description: 'Middle task', completed: false })
      .execute();
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(tasksTable)
      .values({ description: 'Newest task', completed: false })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result[0].description).toBe('Newest task');
    expect(result[1].description).toBe('Middle task');
    expect(result[2].description).toBe('Oldest task');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle completed and incomplete tasks', async () => {
    // Insert tasks with different completion states
    const completedAt = new Date();
    
    await db.insert(tasksTable)
      .values([
        { description: 'Incomplete task', completed: false },
        { description: 'Completed task', completed: true, completed_at: completedAt }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    
    const incompleteTask = result.find(t => t.description === 'Incomplete task');
    const completedTask = result.find(t => t.description === 'Completed task');
    
    expect(incompleteTask?.completed).toBe(false);
    expect(incompleteTask?.completed_at).toBeNull();
    
    expect(completedTask?.completed).toBe(true);
    expect(completedTask?.completed_at).toBeInstanceOf(Date);
  });

  it('should handle tasks with various descriptions', async () => {
    await db.insert(tasksTable)
      .values([
        { description: 'Short', completed: false },
        { description: 'A much longer task description with more details', completed: false },
        { description: 'Task with special characters !@#$%^&*()', completed: false }
      ])
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    expect(result.some(t => t.description === 'Short')).toBe(true);
    expect(result.some(t => t.description === 'A much longer task description with more details')).toBe(true);
    expect(result.some(t => t.description === 'Task with special characters !@#$%^&*()')).toBe(true);
  });
});
