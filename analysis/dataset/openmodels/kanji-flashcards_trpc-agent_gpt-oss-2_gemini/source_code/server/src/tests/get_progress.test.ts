import { beforeEach, afterEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjisTable, progressTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getProgress } from '../handlers/get_progress';

// Helper to create a user
const createUser = async (email: string, passwordHash: string) => {
  const [user] = await db
    .insert(usersTable)
    .values({ email, password_hash: passwordHash })
    .returning()
    .execute();
  return user;
};

// Helper to create a kanji entry
const createKanji = async (character: string) => {
  const [kanji] = await db
    .insert(kanjisTable)
    .values({
      character,
      meaning: 'meaning',
      onyomi: 'onyomi',
      kunyomi: 'kunyomi',
      jlpt_level: 5,
    })
    .returning()
    .execute();
  return kanji;
};

// Helper to record a progress entry
const recordProgress = async (user_id: number, kanji_id: number, correct: boolean) => {
  await db
    .insert(progressTable)
    .values({ user_id, kanji_id, correct })
    .execute();
};

describe('getProgress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('aggregates correct and incorrect counts per kanji for a user', async () => {
    const user = await createUser('test@example.com', 'hashedpw');
    const kanjiA = await createKanji('日');
    const kanjiB = await createKanji('月');

    // Record some answers
    await recordProgress(user.id, kanjiA.id, true); // correct
    await recordProgress(user.id, kanjiA.id, false); // incorrect
    await recordProgress(user.id, kanjiA.id, true); // correct again
    await recordProgress(user.id, kanjiB.id, false); // incorrect only

    const progress = await getProgress(user.id);

    // Expect two aggregated records
    expect(progress).toHaveLength(2);

    const aggA = progress.find(p => p.kanji_id === kanjiA.id);
    const aggB = progress.find(p => p.kanji_id === kanjiB.id);

    expect(aggA).toBeDefined();
    expect(aggA?.correct_count).toBe(2);
    expect(aggA?.incorrect_count).toBe(1);
    expect(aggA?.user_id).toBe(user.id);

    expect(aggB).toBeDefined();
    expect(aggB?.correct_count).toBe(0);
    expect(aggB?.incorrect_count).toBe(1);
    expect(aggB?.user_id).toBe(user.id);

    // last_reviewed should be a Date instance
    expect(aggA?.last_reviewed).toBeInstanceOf(Date);
    expect(aggB?.last_reviewed).toBeInstanceOf(Date);
  });
});
