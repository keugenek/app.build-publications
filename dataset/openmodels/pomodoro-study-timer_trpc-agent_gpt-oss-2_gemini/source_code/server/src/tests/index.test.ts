import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { createPomodoroSession } from '../handlers/create_session';
import { type CreatePomodoroSessionInput, type PomodoroSession } from '../schema';

const testInput: CreatePomodoroSessionInput = {
  type: 'work',
  duration_minutes: 25,
};

describe('createPomodoroSession handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a session object with correct fields', async () => {
    const result = await createPomodoroSession(testInput);
    // Basic field checks
    expect(result.type).toBe(testInput.type);
    expect(result.duration_minutes).toBe(testInput.duration_minutes);
    expect(result.started_at).toBeInstanceOf(Date);
    expect(result.ended_at).toBeNull();
    expect(result.completed).toBe(false);
    // ID should be a number (placeholder returns 0)
    expect(typeof result.id).toBe('number');
  });

  it('should handle multiple creations without errors', async () => {
    const first = await createPomodoroSession(testInput);
    const second = await createPomodoroSession({ type: 'break', duration_minutes: 5 });
    // Ensure both calls succeed and return distinct objects
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first.type).toBe('work');
    expect(second.type).toBe('break');
  });
});
