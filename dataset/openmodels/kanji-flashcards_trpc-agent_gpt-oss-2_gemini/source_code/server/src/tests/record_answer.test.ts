import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjisTable, progressTable } from '../db/schema';
import { type RecordAnswerInput, type Progress } from '../schema';
import { recordAnswer } from '../handlers/record_answer';
import { eq } from 'drizzle-orm';

// Helper to create a user and return its id
async function createTestUser(email: string) {
  const result = await db.insert(usersTable).values({
    email,
    password_hash: 'hashed', // dummy hash
  }).returning().execute();
  return result[0].id;
}

// Helper to create a kanji entry and return its id
async function createTestKanji() {
  const result = await db.insert(kanjisTable).values({
    character: '日',
    meaning: 'sun',
    onyomi: 'ニチ',
    kunyomi: 'ひ',
    jlpt_level: 5,
  }).returning().execute();
  return result[0].id;
}

describe('recordAnswer handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('records an answer and returns aggregated progress', async () => {
    const userId = await createTestUser('test@example.com');
    const kanjiId = await createTestKanji();

    const input: RecordAnswerInput = {
      user_id: userId,
      kanji_id: kanjiId,
      correct: true,
    };

    const result: Progress = await recordAnswer(input);

    expect(result.user_id).toBe(userId);
    expect(result.kanji_id).toBe(kanjiId);
    expect(result.correct_count).toBe(1);
    expect(result.incorrect_count).toBe(0);
    expect(result.last_reviewed).toBeInstanceOf(Date);
    expect(result.next_review).toBeUndefined();

    // Verify row exists in DB
    const rows = await db.select().from(progressTable).where(eq(progressTable.user_id, userId)).execute();
    expect(rows).toHaveLength(1);
    expect(rows[0].correct).toBe(true);
  });

  it('aggregates multiple answers correctly', async () => {
    const userId = await createTestUser('agg@example.com');
    const kanjiId = await createTestKanji();

    // First correct answer
    await recordAnswer({ user_id: userId, kanji_id: kanjiId, correct: true });
    // Second incorrect answer
    const secondResult = await recordAnswer({ user_id: userId, kanji_id: kanjiId, correct: false });

    expect(secondResult.correct_count).toBe(1);
    expect(secondResult.incorrect_count).toBe(1);
    expect(secondResult.last_reviewed).toBeInstanceOf(Date);
    // Ensure last_reviewed is later than the first record's reviewed_at
    const rows = await db.select().from(progressTable).where(eq(progressTable.user_id, userId)).execute();
    const dates = rows.map(r => r.reviewed_at as Date);
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    expect(secondResult.last_reviewed.getTime()).toBe(maxDate.getTime());
  });
});
