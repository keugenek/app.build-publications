import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type CreateKanjiInput, type CreateUserProgressInput } from '../schema';
import { getProgressSummary } from '../handlers/get_progress_summary';

// Test data
const testKanjiN5: CreateKanjiInput[] = [
  {
    character: '一',
    meaning: 'one',
    on_reading: 'イチ',
    kun_reading: 'ひと',
    jlpt_level: 'N5'
  },
  {
    character: '二',
    meaning: 'two',
    on_reading: 'ニ',
    kun_reading: 'ふた',
    jlpt_level: 'N5'
  },
  {
    character: '三',
    meaning: 'three',
    on_reading: 'サン',
    kun_reading: 'みっつ',
    jlpt_level: 'N5'
  }
];

const testKanjiN4: CreateKanjiInput[] = [
  {
    character: '四',
    meaning: 'four',
    on_reading: 'シ',
    kun_reading: 'よん',
    jlpt_level: 'N4'
  },
  {
    character: '五',
    meaning: 'five',
    on_reading: 'ゴ',
    kun_reading: 'いつつ',
    jlpt_level: 'N4'
  }
];

describe('getProgressSummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no kanji exist', async () => {
    const result = await getProgressSummary('user123');

    expect(result).toEqual([]);
  });

  it('should return progress summaries for all levels when no specific level requested', async () => {
    // Create test kanji
    const n5Kanji = await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    const n4Kanji = await db.insert(kanjiTable)
      .values(testKanjiN4)
      .returning()
      .execute();

    // Create progress records - mark some as learned
    const progressRecords: CreateUserProgressInput[] = [
      {
        user_id: 'user123',
        kanji_id: n5Kanji[0].id,
        is_learned: true,
        review_count: 3
      },
      {
        user_id: 'user123',
        kanji_id: n5Kanji[1].id,
        is_learned: true,
        review_count: 2
      },
      {
        user_id: 'user123',
        kanji_id: n5Kanji[2].id,
        is_learned: false,
        review_count: 1
      },
      {
        user_id: 'user123',
        kanji_id: n4Kanji[0].id,
        is_learned: true,
        review_count: 1
      },
      {
        user_id: 'user123',
        kanji_id: n4Kanji[1].id,
        is_learned: false,
        review_count: 0
      }
    ];

    await db.insert(userProgressTable)
      .values(progressRecords)
      .execute();

    const result = await getProgressSummary('user123');

    // Should return summaries for both levels
    expect(result).toHaveLength(2);
    
    // Find N5 and N4 summaries
    const n5Summary = result.find(s => s.jlpt_level === 'N5');
    const n4Summary = result.find(s => s.jlpt_level === 'N4');

    // Validate N5 summary
    expect(n5Summary).toBeDefined();
    expect(n5Summary!.total_kanji).toBe(3);
    expect(n5Summary!.learned_kanji).toBe(2);
    expect(n5Summary!.progress_percentage).toBe(67); // 2/3 = 66.67% rounded to 67%

    // Validate N4 summary
    expect(n4Summary).toBeDefined();
    expect(n4Summary!.total_kanji).toBe(2);
    expect(n4Summary!.learned_kanji).toBe(1);
    expect(n4Summary!.progress_percentage).toBe(50); // 1/2 = 50%
  });

  it('should return progress summary for specific JLPT level only', async () => {
    // Create test kanji
    const n5Kanji = await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    const n4Kanji = await db.insert(kanjiTable)
      .values(testKanjiN4)
      .returning()
      .execute();

    // Create progress records
    const progressRecords: CreateUserProgressInput[] = [
      {
        user_id: 'user123',
        kanji_id: n5Kanji[0].id,
        is_learned: true,
        review_count: 3
      },
      {
        user_id: 'user123',
        kanji_id: n4Kanji[0].id,
        is_learned: true,
        review_count: 1
      }
    ];

    await db.insert(userProgressTable)
      .values(progressRecords)
      .execute();

    // Request only N5 summary
    const result = await getProgressSummary('user123', 'N5');

    // Should return only N5 summary
    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toBe('N5');
    expect(result[0].total_kanji).toBe(3);
    expect(result[0].learned_kanji).toBe(1);
    expect(result[0].progress_percentage).toBe(33); // 1/3 = 33.33% rounded to 33%
  });

  it('should handle user with no progress records', async () => {
    // Create test kanji but no progress records
    await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    const result = await getProgressSummary('user123');

    expect(result).toHaveLength(1);
    expect(result[0].jlpt_level).toBe('N5');
    expect(result[0].total_kanji).toBe(3);
    expect(result[0].learned_kanji).toBe(0);
    expect(result[0].progress_percentage).toBe(0);
  });

  it('should handle different users separately', async () => {
    // Create test kanji
    const n5Kanji = await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    // Create progress records for two different users
    const user1Progress: CreateUserProgressInput[] = [
      {
        user_id: 'user1',
        kanji_id: n5Kanji[0].id,
        is_learned: true,
        review_count: 1
      },
      {
        user_id: 'user1',
        kanji_id: n5Kanji[1].id,
        is_learned: true,
        review_count: 1
      }
    ];

    const user2Progress: CreateUserProgressInput[] = [
      {
        user_id: 'user2',
        kanji_id: n5Kanji[0].id,
        is_learned: true,
        review_count: 1
      }
    ];

    await db.insert(userProgressTable)
      .values([...user1Progress, ...user2Progress])
      .execute();

    // Get summaries for each user
    const user1Result = await getProgressSummary('user1');
    const user2Result = await getProgressSummary('user2');

    // User1 should have 2 learned kanji
    expect(user1Result).toHaveLength(1);
    expect(user1Result[0].learned_kanji).toBe(2);
    expect(user1Result[0].progress_percentage).toBe(67); // 2/3

    // User2 should have 1 learned kanji
    expect(user2Result).toHaveLength(1);
    expect(user2Result[0].learned_kanji).toBe(1);
    expect(user2Result[0].progress_percentage).toBe(33); // 1/3
  });

  it('should only count learned kanji (is_learned = true)', async () => {
    // Create test kanji
    const n5Kanji = await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    // Create progress records with mixed learned/unlearned status
    const progressRecords: CreateUserProgressInput[] = [
      {
        user_id: 'user123',
        kanji_id: n5Kanji[0].id,
        is_learned: true,
        review_count: 5
      },
      {
        user_id: 'user123',
        kanji_id: n5Kanji[1].id,
        is_learned: false,
        review_count: 10 // High review count but not learned
      },
      {
        user_id: 'user123',
        kanji_id: n5Kanji[2].id,
        is_learned: false,
        review_count: 0
      }
    ];

    await db.insert(userProgressTable)
      .values(progressRecords)
      .execute();

    const result = await getProgressSummary('user123');

    expect(result).toHaveLength(1);
    expect(result[0].total_kanji).toBe(3);
    expect(result[0].learned_kanji).toBe(1); // Only the one with is_learned = true
    expect(result[0].progress_percentage).toBe(33); // 1/3
  });

  it('should handle zero division gracefully', async () => {
    // Create kanji with specific level that user won't have progress for
    await db.insert(kanjiTable)
      .values([{
        character: '十',
        meaning: 'ten',
        on_reading: 'ジュウ',
        kun_reading: 'とお',
        jlpt_level: 'N3'
      }])
      .returning()
      .execute();

    const result = await getProgressSummary('user123', 'N3');

    expect(result).toHaveLength(1);
    expect(result[0].total_kanji).toBe(1);
    expect(result[0].learned_kanji).toBe(0);
    expect(result[0].progress_percentage).toBe(0);
  });

  it('should return empty array for non-existent JLPT level filter', async () => {
    // Create N5 kanji but request N1 summary
    await db.insert(kanjiTable)
      .values(testKanjiN5)
      .returning()
      .execute();

    const result = await getProgressSummary('user123', 'N1');

    expect(result).toEqual([]);
  });
});
