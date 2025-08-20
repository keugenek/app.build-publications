import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProgressTable } from '../db/schema';
import { type NewUserProgress } from '../db/schema';

import { getUserProgress } from '../handlers/get_user_progress';

describe('getUserProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const userId = 'test-user-123';

  const testProgressData: NewUserProgress[] = [
    {
      userId,
      jlptLevel: 'N5',
      masteredKanjiCount: 10,
      totalKanjiCount: 50,
    },
    {
      userId,
      jlptLevel: 'N4',
      masteredKanjiCount: 5,
      totalKanjiCount: 75,
    }
  ];

  it('should return an empty array when no progress exists for user', async () => {
    const result = await getUserProgress('non-existent-user');
    expect(result).toEqual([]);
  });

  it('should fetch user progress for existing user', async () => {
    // Insert test data
    await db.insert(userProgressTable).values(testProgressData).execute();
    
    const result = await getUserProgress(userId);
    
    expect(result).toHaveLength(2);
    expect(result[0].userId).toEqual(userId);
    expect(result[1].userId).toEqual(userId);
    
    // Verify we get the progress data for both JLPT levels
    const n5Progress = result.find(p => p.jlptLevel === 'N5');
    const n4Progress = result.find(p => p.jlptLevel === 'N4');
    
    expect(n5Progress).toBeDefined();
    expect(n5Progress?.masteredKanjiCount).toEqual(10);
    expect(n5Progress?.totalKanjiCount).toEqual(50);
    
    expect(n4Progress).toBeDefined();
    expect(n4Progress?.masteredKanjiCount).toEqual(5);
    expect(n4Progress?.totalKanjiCount).toEqual(75);
  });

  it('should only return progress for the specified user', async () => {
    // Insert progress for different users
    await db.insert(userProgressTable).values([
      ...testProgressData,
      {
        userId: 'another-user',
        jlptLevel: 'N3',
        masteredKanjiCount: 20,
        totalKanjiCount: 100,
      }
    ]).execute();
    
    const result = await getUserProgress(userId);
    
    // Should only return progress for our test user, not the other user
    expect(result).toHaveLength(2);
    expect(result.every(p => p.userId === userId)).toBe(true);
  });
});
