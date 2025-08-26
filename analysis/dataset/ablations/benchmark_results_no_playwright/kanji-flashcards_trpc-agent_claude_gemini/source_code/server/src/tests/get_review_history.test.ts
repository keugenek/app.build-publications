import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, kanjiTable, reviewHistoryTable } from '../db/schema';
import { getReviewHistory } from '../handlers/get_review_history';

describe('getReviewHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return review history for a user', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create test kanji
    const [kanji] = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create review history record
    const reviewData = {
      user_id: user.id,
      kanji_id: kanji.id,
      result: 'CORRECT' as const,
      previous_srs_level: 'APPRENTICE_1' as const,
      new_srs_level: 'APPRENTICE_2' as const,
      review_time_ms: 3500
    };

    const [reviewHistory] = await db.insert(reviewHistoryTable)
      .values(reviewData)
      .returning()
      .execute();

    // Test the handler
    const result = await getReviewHistory(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].id).toEqual(reviewHistory.id);
    expect(result[0].user_id).toEqual(user.id);
    expect(result[0].kanji_id).toEqual(kanji.id);
    expect(result[0].result).toEqual('CORRECT');
    expect(result[0].previous_srs_level).toEqual('APPRENTICE_1');
    expect(result[0].new_srs_level).toEqual('APPRENTICE_2');
    expect(result[0].review_time_ms).toEqual(3500);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return empty array for user with no review history', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const result = await getReviewHistory(user.id);

    expect(result).toHaveLength(0);
  });

  it('should return reviews ordered by created_at descending (most recent first)', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create test kanji
    const [kanji1] = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    const [kanji2] = await db.insert(kanjiTable)
      .values({
        character: '火',
        meaning_english: 'fire',
        reading_hiragana: 'ひ',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create older review first
    const olderReview = await db.insert(reviewHistoryTable)
      .values({
        user_id: user.id,
        kanji_id: kanji1.id,
        result: 'CORRECT',
        previous_srs_level: 'APPRENTICE_1',
        new_srs_level: 'APPRENTICE_2',
        review_time_ms: 2000,
        created_at: new Date('2023-01-01T10:00:00Z')
      })
      .returning()
      .execute();

    // Create newer review
    const newerReview = await db.insert(reviewHistoryTable)
      .values({
        user_id: user.id,
        kanji_id: kanji2.id,
        result: 'INCORRECT',
        previous_srs_level: 'APPRENTICE_2',
        new_srs_level: 'APPRENTICE_1',
        review_time_ms: 5000,
        created_at: new Date('2023-01-02T10:00:00Z')
      })
      .returning()
      .execute();

    const result = await getReviewHistory(user.id);

    expect(result).toHaveLength(2);
    // Most recent should be first
    expect(result[0].id).toEqual(newerReview[0].id);
    expect(result[0].kanji_id).toEqual(kanji2.id);
    expect(result[1].id).toEqual(olderReview[0].id);
    expect(result[1].kanji_id).toEqual(kanji1.id);
  });

  it('should respect limit parameter', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create multiple test kanji
    const kanjiData = [
      { character: '水', meaning_english: 'water', reading_hiragana: 'みず' },
      { character: '火', meaning_english: 'fire', reading_hiragana: 'ひ' },
      { character: '木', meaning_english: 'tree', reading_hiragana: 'き' }
    ];

    const kanjiRecords = [];
    for (const data of kanjiData) {
      const [kanji] = await db.insert(kanjiTable)
        .values({
          ...data,
          reading_katakana: null,
          jlpt_level: 'N5'
        })
        .returning()
        .execute();
      kanjiRecords.push(kanji);
    }

    // Create multiple review history records
    for (let i = 0; i < 3; i++) {
      await db.insert(reviewHistoryTable)
        .values({
          user_id: user.id,
          kanji_id: kanjiRecords[i].id,
          result: 'CORRECT',
          previous_srs_level: 'APPRENTICE_1',
          new_srs_level: 'APPRENTICE_2',
          review_time_ms: 3000 + i * 500
        })
        .execute();
    }

    // Test with limit of 2
    const result = await getReviewHistory(user.id, 2);

    expect(result).toHaveLength(2);
  });

  it('should use default limit of 50 when not specified', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create test kanji
    const [kanji] = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create one review
    await db.insert(reviewHistoryTable)
      .values({
        user_id: user.id,
        kanji_id: kanji.id,
        result: 'CORRECT',
        previous_srs_level: 'APPRENTICE_1',
        new_srs_level: 'APPRENTICE_2',
        review_time_ms: 3000
      })
      .execute();

    // Call without limit parameter
    const result = await getReviewHistory(user.id);

    expect(result).toHaveLength(1);
  });

  it('should only return reviews for the specified user', async () => {
    // Create two test users
    const [user1] = await db.insert(usersTable)
      .values({
        email: 'user1@example.com',
        username: 'user1',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        email: 'user2@example.com',
        username: 'user2',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create test kanji
    const [kanji] = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create review for user1
    await db.insert(reviewHistoryTable)
      .values({
        user_id: user1.id,
        kanji_id: kanji.id,
        result: 'CORRECT',
        previous_srs_level: 'APPRENTICE_1',
        new_srs_level: 'APPRENTICE_2',
        review_time_ms: 3000
      })
      .execute();

    // Create review for user2
    await db.insert(reviewHistoryTable)
      .values({
        user_id: user2.id,
        kanji_id: kanji.id,
        result: 'INCORRECT',
        previous_srs_level: 'APPRENTICE_2',
        new_srs_level: 'APPRENTICE_1',
        review_time_ms: 4000
      })
      .execute();

    // Get reviews for user1 only
    const result = await getReviewHistory(user1.id);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(user1.id);
    expect(result[0].result).toEqual('CORRECT');
  });

  it('should handle different review results and SRS levels', async () => {
    // Create test user
    const [user] = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        username: 'testuser',
        password_hash: 'hashedpassword'
      })
      .returning()
      .execute();

    // Create test kanji
    const [kanji] = await db.insert(kanjiTable)
      .values({
        character: '水',
        meaning_english: 'water',
        reading_hiragana: 'みず',
        reading_katakana: null,
        jlpt_level: 'N5'
      })
      .returning()
      .execute();

    // Create review with INCORRECT result and BURNED level
    const reviewData = {
      user_id: user.id,
      kanji_id: kanji.id,
      result: 'INCORRECT' as const,
      previous_srs_level: 'BURNED' as const,
      new_srs_level: 'ENLIGHTENED' as const,
      review_time_ms: 8500
    };

    await db.insert(reviewHistoryTable)
      .values(reviewData)
      .execute();

    const result = await getReviewHistory(user.id);

    expect(result).toHaveLength(1);
    expect(result[0].result).toEqual('INCORRECT');
    expect(result[0].previous_srs_level).toEqual('BURNED');
    expect(result[0].new_srs_level).toEqual('ENLIGHTENED');
    expect(result[0].review_time_ms).toEqual(8500);
  });
});
