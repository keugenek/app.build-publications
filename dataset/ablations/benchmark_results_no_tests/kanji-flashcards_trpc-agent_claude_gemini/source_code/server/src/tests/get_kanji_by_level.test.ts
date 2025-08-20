import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { type GetKanjiByLevelInput } from '../schema';
import { getKanjiByLevel } from '../handlers/get_kanji_by_level';

describe('getKanjiByLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Create test data helper
  async function createTestKanji() {
    // Create kanji for different JLPT levels
    const kanjiData = [
      {
        character: '水',
        meaning: 'water',
        on_reading: 'スイ',
        kun_reading: 'みず',
        jlpt_level: 'N5' as const
      },
      {
        character: '火',
        meaning: 'fire',
        on_reading: 'カ',
        kun_reading: 'ひ',
        jlpt_level: 'N5' as const
      },
      {
        character: '学',
        meaning: 'study',
        on_reading: 'ガク',
        kun_reading: 'まな',
        jlpt_level: 'N4' as const
      },
      {
        character: '経',
        meaning: 'sutra, longitude',
        on_reading: 'ケイ、キョウ',
        kun_reading: 'へ、た',
        jlpt_level: 'N3' as const
      }
    ];

    const results = await db.insert(kanjiTable)
      .values(kanjiData)
      .returning()
      .execute();

    return results;
  }

  async function createTestUserProgress(userId: string, kanjiIds: number[]) {
    const progressData = [
      {
        user_id: userId,
        kanji_id: kanjiIds[0], // First kanji - learned
        is_learned: true,
        review_count: 5,
        last_reviewed: new Date('2024-01-15'),
        next_review: new Date('2024-01-20')
      },
      {
        user_id: userId,
        kanji_id: kanjiIds[1], // Second kanji - not learned yet
        is_learned: false,
        review_count: 2,
        last_reviewed: new Date('2024-01-10'),
        next_review: new Date('2024-01-16')
      }
    ];

    return await db.insert(userProgressTable)
      .values(progressData)
      .returning()
      .execute();
  }

  it('should return kanji for specified JLPT level without user progress', async () => {
    const testKanji = await createTestKanji();

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5'
    };

    const result = await getKanjiByLevel(input);

    // Should return 2 N5 kanji
    expect(result).toHaveLength(2);

    // Verify kanji data
    const waterKanji = result.find(k => k.character === '水');
    expect(waterKanji).toBeDefined();
    expect(waterKanji!.meaning).toEqual('water');
    expect(waterKanji!.on_reading).toEqual('スイ');
    expect(waterKanji!.kun_reading).toEqual('みず');
    expect(waterKanji!.jlpt_level).toEqual('N5');
    expect(waterKanji!.progress).toBeNull();
    expect(waterKanji!.created_at).toBeInstanceOf(Date);

    const fireKanji = result.find(k => k.character === '火');
    expect(fireKanji).toBeDefined();
    expect(fireKanji!.meaning).toEqual('fire');
    expect(fireKanji!.progress).toBeNull();
  });

  it('should return kanji with user progress when user_id provided', async () => {
    const testKanji = await createTestKanji();
    const userId = 'test-user-123';
    
    // Create progress for first two N5 kanji
    const n5KanjiIds = testKanji
      .filter(k => k.jlpt_level === 'N5')
      .map(k => k.id);
    
    await createTestUserProgress(userId, n5KanjiIds);

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      user_id: userId
    };

    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(2);

    // Find the learned kanji (first one in test data)
    const learnedKanji = result.find(k => k.progress?.is_learned === true);
    expect(learnedKanji).toBeDefined();
    expect(learnedKanji!.progress).toBeDefined();
    expect(learnedKanji!.progress!.is_learned).toBe(true);
    expect(learnedKanji!.progress!.review_count).toEqual(5);
    expect(learnedKanji!.progress!.last_reviewed).toEqual(new Date('2024-01-15'));
    expect(learnedKanji!.progress!.next_review).toEqual(new Date('2024-01-20'));

    // Find the unlearned kanji
    const unlearnedKanji = result.find(k => k.progress?.is_learned === false);
    expect(unlearnedKanji).toBeDefined();
    expect(unlearnedKanji!.progress).toBeDefined();
    expect(unlearnedKanji!.progress!.is_learned).toBe(false);
    expect(unlearnedKanji!.progress!.review_count).toEqual(2);
  });

  it('should return kanji with null progress for user with no progress data', async () => {
    await createTestKanji();

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      user_id: 'user-with-no-progress'
    };

    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(2);
    
    // All kanji should have null progress
    result.forEach(kanji => {
      expect(kanji.progress).toBeNull();
      expect(kanji.jlpt_level).toEqual('N5');
    });
  });

  it('should return empty array for JLPT level with no kanji', async () => {
    await createTestKanji(); // Only creates N5, N4, N3 kanji

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N1'
    };

    const result = await getKanjiByLevel(input);

    expect(result).toHaveLength(0);
  });

  it('should filter correctly by different JLPT levels', async () => {
    await createTestKanji();

    // Test N4 level
    const n4Result = await getKanjiByLevel({ jlpt_level: 'N4' });
    expect(n4Result).toHaveLength(1);
    expect(n4Result[0].character).toEqual('学');
    expect(n4Result[0].jlpt_level).toEqual('N4');

    // Test N3 level
    const n3Result = await getKanjiByLevel({ jlpt_level: 'N3' });
    expect(n3Result).toHaveLength(1);
    expect(n3Result[0].character).toEqual('経');
    expect(n3Result[0].jlpt_level).toEqual('N3');
  });

  it('should handle kanji with nullable readings correctly', async () => {
    // Create kanji with null readings
    const kanjiWithNullReadings = await db.insert(kanjiTable)
      .values({
        character: '々',
        meaning: 'repetition mark',
        on_reading: null,
        kun_reading: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5'
    };

    const result = await getKanjiByLevel(input);

    const nullReadingKanji = result.find(k => k.character === '々');
    expect(nullReadingKanji).toBeDefined();
    expect(nullReadingKanji!.on_reading).toBeNull();
    expect(nullReadingKanji!.kun_reading).toBeNull();
    expect(nullReadingKanji!.meaning).toEqual('repetition mark');
  });

  it('should handle progress with null review dates correctly', async () => {
    const testKanji = await createTestKanji();
    const userId = 'test-user-dates';
    
    // Get first N5 kanji
    const n5Kanji = testKanji.find(k => k.jlpt_level === 'N5');
    expect(n5Kanji).toBeDefined();

    // Create progress with null dates
    await db.insert(userProgressTable)
      .values({
        user_id: userId,
        kanji_id: n5Kanji!.id,
        is_learned: false,
        review_count: 0,
        last_reviewed: null,
        next_review: null
      })
      .execute();

    const input: GetKanjiByLevelInput = {
      jlpt_level: 'N5',
      user_id: userId
    };

    const result = await getKanjiByLevel(input);

    const kanjiWithNullDates = result.find(k => k.id === n5Kanji!.id);
    expect(kanjiWithNullDates).toBeDefined();
    expect(kanjiWithNullDates!.progress).toBeDefined();
    expect(kanjiWithNullDates!.progress!.last_reviewed).toBeNull();
    expect(kanjiWithNullDates!.progress!.next_review).toBeNull();
    expect(kanjiWithNullDates!.progress!.review_count).toEqual(0);
  });
});
