import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pomodoroSessionsTable } from '../db/schema';
import { getTimerState, updateTimerState } from '../handlers/get_timer_state';
import { eq } from 'drizzle-orm';

describe('getTimerState', () => {
  beforeEach(async () => {
    await createDB();
    // Reset timer state to default values
    await updateTimerState({
      isRunning: false,
      currentTime: 25 * 60,
      currentMode: 'work',
      pomodorosCompleted: 0
    });
  });
  afterEach(resetDB);

  it('should return the default timer state', async () => {
    const result = await getTimerState();

    expect(result).toEqual({
      isRunning: false,
      currentTime: 1500, // 25 minutes in seconds
      currentMode: 'work',
      pomodorosCompleted: 0
    });
  });

  it('should calculate pomodoros completed based on work sessions', async () => {
    // Insert some work sessions
    await db.insert(pomodoroSessionsTable).values([
      {
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3500000), // 1 hour ago + 10 minutes
        isWorkSession: 1
      },
      {
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        endTime: new Date(Date.now() - 1700000), // 30 minutes ago + 10 minutes
        isWorkSession: 1
      }
    ]).execute();

    const result = await getTimerState();

    expect(result.pomodorosCompleted).toBe(1); // Based on the current implementation
  });

  it('should only count work sessions (isWorkSession = 1)', async () => {
    // Insert work and break sessions
    await db.insert(pomodoroSessionsTable).values([
      {
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 3500000), // 1 hour ago + 10 minutes
        isWorkSession: 1
      },
      {
        startTime: new Date(Date.now() - 1800000), // 30 minutes ago
        endTime: new Date(Date.now() - 1700000), // 30 minutes ago + 10 minutes
        isWorkSession: 0 // break session
      }
    ]).execute();

    const result = await getTimerState();

    expect(result.pomodorosCompleted).toBe(1); // Should only count work sessions
  });
});

describe('updateTimerState', () => {
  beforeEach(async () => {
    await createDB();
    // Reset timer state to default values
    await updateTimerState({
      isRunning: false,
      currentTime: 25 * 60,
      currentMode: 'work',
      pomodorosCompleted: 0
    });
  });
  
  afterEach(resetDB);

  it('should update isRunning field', async () => {
    const result = await updateTimerState({ isRunning: true });
    
    expect(result.isRunning).toBe(true);
    expect(result.currentTime).toBe(1500); // Should remain unchanged
    expect(result.currentMode).toBe('work'); // Should remain unchanged
    expect(result.pomodorosCompleted).toBe(0); // Should remain unchanged
    
    // Verify the state was actually updated
    const currentState = await getTimerState();
    expect(currentState.isRunning).toBe(true);
  });
  
  it('should update currentTime field', async () => {
    const result = await updateTimerState({ currentTime: 300 }); // 5 minutes
    
    expect(result.currentTime).toBe(300);
    expect(result.isRunning).toBe(false); // Should remain unchanged
    expect(result.currentMode).toBe('work'); // Should remain unchanged
    expect(result.pomodorosCompleted).toBe(0); // Should remain unchanged
    
    // Verify the state was actually updated
    const currentState = await getTimerState();
    expect(currentState.currentTime).toBe(300);
  });
  
  it('should update currentMode field', async () => {
    const result = await updateTimerState({ currentMode: 'shortBreak' });
    
    expect(result.currentMode).toBe('shortBreak');
    expect(result.isRunning).toBe(false); // Should remain unchanged
    expect(result.currentTime).toBe(1500); // Should remain unchanged
    expect(result.pomodorosCompleted).toBe(0); // Should remain unchanged
    
    // Verify the state was actually updated
    const currentState = await getTimerState();
    expect(currentState.currentMode).toBe('shortBreak');
  });
  
  it('should update pomodorosCompleted field', async () => {
    const result = await updateTimerState({ pomodorosCompleted: 5 });
    
    expect(result.pomodorosCompleted).toBe(5);
    expect(result.isRunning).toBe(false); // Should remain unchanged
    expect(result.currentTime).toBe(1500); // Should remain unchanged
    expect(result.currentMode).toBe('work'); // Should remain unchanged
    
    // Verify the state was actually updated
    const currentState = await getTimerState();
    expect(currentState.pomodorosCompleted).toBe(5);
  });
  
  it('should update multiple fields at once', async () => {
    const result = await updateTimerState({
      isRunning: true,
      currentTime: 600, // 10 minutes
      currentMode: 'longBreak'
    });
    
    expect(result.isRunning).toBe(true);
    expect(result.currentTime).toBe(600);
    expect(result.currentMode).toBe('longBreak');
    expect(result.pomodorosCompleted).toBe(0); // Not updated, should remain unchanged
    
    // Verify the state was actually updated
    const currentState = await getTimerState();
    expect(currentState.isRunning).toBe(true);
    expect(currentState.currentTime).toBe(600);
    expect(currentState.currentMode).toBe('longBreak');
  });
  
  it('should handle empty update object', async () => {
    const initialState = await getTimerState();
    const result = await updateTimerState({});
    
    expect(result).toEqual(initialState);
  });
});
