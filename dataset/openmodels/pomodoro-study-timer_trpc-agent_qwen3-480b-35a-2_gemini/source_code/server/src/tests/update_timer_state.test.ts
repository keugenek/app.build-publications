import { beforeEach, describe, expect, it } from 'bun:test';
import { getTimerState, updateTimerState } from '../handlers/update_timer_state';
import { type TimerState } from '../schema';

describe('updateTimerState', () => {
  beforeEach(() => {
    // Reset the timer state to default values before each test
    updateTimerState({
      isRunning: false,
      currentTime: 25 * 60,
      currentMode: 'work',
      pomodorosCompleted: 0
    });
  });

  it('should update the timer state with provided values', async () => {
    const input: Partial<TimerState> = {
      isRunning: true,
      currentTime: 1500,
      currentMode: 'shortBreak'
    };

    const result = await updateTimerState(input);

    expect(result.isRunning).toBe(true);
    expect(result.currentTime).toBe(1500);
    expect(result.currentMode).toBe('shortBreak');
    expect(result.pomodorosCompleted).toBe(0); // Should remain unchanged
  });

  it('should update only the provided fields', async () => {
    const input: Partial<TimerState> = {
      isRunning: true
    };

    const result = await updateTimerState(input);

    expect(result.isRunning).toBe(true);
    expect(result.currentTime).toBe(25 * 60); // Should remain unchanged
    expect(result.currentMode).toBe('work'); // Should remain unchanged
    expect(result.pomodorosCompleted).toBe(0); // Should remain unchanged
  });

  it('should handle updating all fields', async () => {
    const input: Partial<TimerState> = {
      isRunning: true,
      currentTime: 300,
      currentMode: 'longBreak',
      pomodorosCompleted: 3
    };

    const result = await updateTimerState(input);

    expect(result.isRunning).toBe(true);
    expect(result.currentTime).toBe(300);
    expect(result.currentMode).toBe('longBreak');
    expect(result.pomodorosCompleted).toBe(3);
  });

  it('should return the updated state', async () => {
    const input: Partial<TimerState> = {
      pomodorosCompleted: 5
    };

    const result = await updateTimerState(input);

    // The result should be the same object that was updated
    expect(result.pomodorosCompleted).toBe(5);
    expect(typeof result.isRunning).toBe('boolean');
    expect(typeof result.currentTime).toBe('number');
    expect(typeof result.currentMode).toBe('string');
  });

  describe('getTimerState', () => {
    it('should return the current timer state', async () => {
      // First set a specific state
      await updateTimerState({
        isRunning: true,
        currentTime: 1500,
        currentMode: 'shortBreak',
        pomodorosCompleted: 2
      });

      // Then get the state
      const result = await getTimerState();

      expect(result).toEqual({
        isRunning: true,
        currentTime: 1500,
        currentMode: 'shortBreak',
        pomodorosCompleted: 2
      });
    });

    it('should return a TimerState object with correct types', async () => {
      const result = await getTimerState();

      expect(typeof result.isRunning).toBe('boolean');
      expect(typeof result.currentTime).toBe('number');
      expect(typeof result.currentMode).toBe('string');
      expect(typeof result.pomodorosCompleted).toBe('number');
      
      // Check that currentMode is one of the allowed values
      expect(['work', 'shortBreak', 'longBreak']).toContain(result.currentMode);
    });
  });
});
