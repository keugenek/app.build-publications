import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { kanjiTable, userProgressTable } from '../db/schema';
import { getDueReviews } from '../handlers/get_due_reviews';

describe('getDueReviews', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return kanji with null next_review dates', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning: 'water',
        on_reading: 'スイ',
        kun_reading: 'みず',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create user progress with null next_review (new card)
    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiResult[0].id,
        is_learned: false,
        review_count: 0,
        last_reviewed: null,
        next_review: null
      })
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(1);
    expect(results[0].character).toEqual('水');
    expect(results[0].meaning).toEqual('water');
    expect(results[0].progress).toBeDefined();
    expect(results[0].progress!.next_review).toBeNull();
    expect(results[0].progress!.review_count).toEqual(0);
  });

  it('should return kanji with past next_review dates', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '火',
        meaning: 'fire',
        on_reading: 'カ',
        kun_reading: 'ひ',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create user progress with past next_review date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1); // Yesterday

    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiResult[0].id,
        is_learned: false,
        review_count: 2,
        last_reviewed: new Date(),
        next_review: pastDate
      })
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(1);
    expect(results[0].character).toEqual('火');
    expect(results[0].progress!.review_count).toEqual(2);
    expect(results[0].progress!.next_review).toEqual(pastDate);
  });

  it('should not return kanji with future next_review dates', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '木',
        meaning: 'tree',
        on_reading: 'モク',
        kun_reading: 'き',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create user progress with future next_review date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiResult[0].id,
        is_learned: true,
        review_count: 5,
        last_reviewed: new Date(),
        next_review: futureDate
      })
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(0);
  });

  it('should only return kanji for the specified user', async () => {
    // Create test kanji
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '土',
        meaning: 'earth',
        on_reading: 'ド',
        kun_reading: 'つち',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create progress for user1 (due for review)
    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiResult[0].id,
        is_learned: false,
        review_count: 1,
        next_review: null
      })
      .execute();

    // Create progress for user2 (also due for review)
    await db.insert(userProgressTable)
      .values({
        user_id: 'user2',
        kanji_id: kanjiResult[0].id,
        is_learned: false,
        review_count: 1,
        next_review: null
      })
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(1);
    expect(results[0].character).toEqual('土');
  });

  it('should order results by next_review date with nulls first', async () => {
    // Create multiple test kanji
    const kanji1 = await db.insert(kanjiTable)
      .values({
        character: '一',
        meaning: 'one',
        on_reading: 'イチ',
        kun_reading: 'ひと',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    const kanji2 = await db.insert(kanjiTable)
      .values({
        character: '二',
        meaning: 'two',
        on_reading: 'ニ',
        kun_reading: 'ふた',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    const kanji3 = await db.insert(kanjiTable)
      .values({
        character: '三',
        meaning: 'three',
        on_reading: 'サン',
        kun_reading: 'みっ',
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create different review dates
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Create progress records with different next_review dates
    await db.insert(userProgressTable)
      .values([
        {
          user_id: 'user1',
          kanji_id: kanji1[0].id,
          next_review: yesterday // Should be second
        },
        {
          user_id: 'user1',
          kanji_id: kanji2[0].id,
          next_review: null // Should be first (new card)
        },
        {
          user_id: 'user1',
          kanji_id: kanji3[0].id,
          next_review: twoDaysAgo // Should be third (oldest due)
        }
      ])
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(3);
    // Null next_review should come first
    expect(results[0].character).toEqual('二');
    expect(results[0].progress!.next_review).toBeNull();
    
    // Then ordered by next_review date (oldest first)
    expect(results[1].character).toEqual('三');
    expect(results[1].progress!.next_review).toEqual(twoDaysAgo);
    
    expect(results[2].character).toEqual('一');
    expect(results[2].progress!.next_review).toEqual(yesterday);
  });

  it('should return empty array when user has no due reviews', async () => {
    const results = await getDueReviews('nonexistent_user');
    expect(results).toHaveLength(0);
  });

  it('should include all kanji fields and progress data', async () => {
    // Create test kanji with all fields
    const kanjiResult = await db.insert(kanjiTable)
      .values({
        character: '金',
        meaning: 'gold, money',
        on_reading: 'キン',
        kun_reading: 'かね',
        jlpt_level: 'N4'
      })
      .returning()
      .execute();

    const reviewDate = new Date();
    reviewDate.setHours(reviewDate.getHours() - 1); // 1 hour ago

    await db.insert(userProgressTable)
      .values({
        user_id: 'user1',
        kanji_id: kanjiResult[0].id,
        is_learned: true,
        review_count: 3,
        last_reviewed: reviewDate,
        next_review: reviewDate // Due for review
      })
      .execute();

    const results = await getDueReviews('user1');

    expect(results).toHaveLength(1);
    const kanji = results[0];
    
    // Verify kanji fields
    expect(kanji.id).toBeDefined();
    expect(kanji.character).toEqual('金');
    expect(kanji.meaning).toEqual('gold, money');
    expect(kanji.on_reading).toEqual('キン');
    expect(kanji.kun_reading).toEqual('かね');
    expect(kanji.jlpt_level).toEqual('N4');
    expect(kanji.created_at).toBeInstanceOf(Date);
    
    // Verify progress fields
    expect(kanji.progress).toBeDefined();
    expect(kanji.progress!.is_learned).toEqual(true);
    expect(kanji.progress!.review_count).toEqual(3);
    expect(kanji.progress!.last_reviewed).toEqual(reviewDate);
    expect(kanji.progress!.next_review).toEqual(reviewDate);
  });
});
