import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { getSessions } from '../handlers/get_sessions';

describe('getSessions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no sessions exist', async () => {
    const result = await getSessions();
    
    expect(result).toEqual([]);
  });

  it('should return sessions ordered by completion time (most recent first)', async () => {
    // Create test sessions with different completion times
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const twoHoursAgo = new Date(now.getTime() - 7200000);

    // Insert sessions in non-chronological order to test ordering
    await db.insert(sessionsTable)
      .values([
        {
          type: 'work',
          duration: 25,
          completed_at: twoHoursAgo // Oldest
        },
        {
          type: 'break',
          duration: 5,
          completed_at: now // Most recent
        },
        {
          type: 'work',
          duration: 30,
          completed_at: oneHourAgo // Middle
        }
      ])
      .execute();

    const result = await getSessions();

    expect(result).toHaveLength(3);
    
    // Verify ordering (most recent first)
    expect(result[0].completed_at.getTime()).toEqual(now.getTime());
    expect(result[0].type).toEqual('break');
    expect(result[0].duration).toEqual(5);
    
    expect(result[1].completed_at.getTime()).toEqual(oneHourAgo.getTime());
    expect(result[1].type).toEqual('work');
    expect(result[1].duration).toEqual(30);
    
    expect(result[2].completed_at.getTime()).toEqual(twoHoursAgo.getTime());
    expect(result[2].type).toEqual('work');
    expect(result[2].duration).toEqual(25);
  });

  it('should return all session fields correctly', async () => {
    // Insert a single session
    const testSession = {
      type: 'work',
      duration: 45
    };

    await db.insert(sessionsTable)
      .values(testSession)
      .execute();

    const result = await getSessions();

    expect(result).toHaveLength(1);
    
    const session = result[0];
    expect(session.id).toBeDefined();
    expect(typeof session.id).toBe('number');
    expect(session.type).toEqual('work');
    expect(session.duration).toEqual(45);
    expect(session.completed_at).toBeInstanceOf(Date);
    
    // Verify the timestamp is recent (within last minute)
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - session.completed_at.getTime());
    expect(timeDiff).toBeLessThan(60000); // Less than 1 minute
  });

  it('should handle both work and break session types', async () => {
    // Insert both types of sessions
    await db.insert(sessionsTable)
      .values([
        {
          type: 'work',
          duration: 25
        },
        {
          type: 'break',
          duration: 15
        }
      ])
      .execute();

    const result = await getSessions();

    expect(result).toHaveLength(2);
    
    // Check that both session types are present
    const sessionTypes = result.map(s => s.type).sort();
    expect(sessionTypes).toEqual(['break', 'work']);
    
    // Verify durations
    const workSession = result.find(s => s.type === 'work');
    const breakSession = result.find(s => s.type === 'break');
    
    expect(workSession?.duration).toEqual(25);
    expect(breakSession?.duration).toEqual(15);
  });

  it('should handle large number of sessions efficiently', async () => {
    // Create multiple sessions
    const sessions = Array.from({ length: 10 }, (_, i) => ({
      type: i % 2 === 0 ? 'work' : 'break',
      duration: 20 + i,
      completed_at: new Date(Date.now() - (i * 300000)) // 5 minutes apart
    }));

    await db.insert(sessionsTable)
      .values(sessions)
      .execute();

    const result = await getSessions();

    expect(result).toHaveLength(10);
    
    // Verify ordering (should be in reverse chronological order)
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].completed_at.getTime())
        .toBeGreaterThanOrEqual(result[i + 1].completed_at.getTime());
    }
    
    // Verify all sessions have required fields
    result.forEach(session => {
      expect(session.id).toBeDefined();
      expect(['work', 'break']).toContain(session.type);
      expect(typeof session.duration).toBe('number');
      expect(session.completed_at).toBeInstanceOf(Date);
    });
  });
});
