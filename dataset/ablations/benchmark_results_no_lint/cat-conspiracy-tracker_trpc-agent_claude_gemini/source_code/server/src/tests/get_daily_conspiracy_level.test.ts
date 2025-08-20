import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catsTable, activitiesTable } from '../db/schema';
import { type GetDailyConspiracyInput, type CreateCatInput, type CreateActivityInput } from '../schema';
import { getDailyConspiracyLevel } from '../handlers/get_daily_conspiracy_level';

describe('getDailyConspiracyLevel', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  const testDate = '2024-01-15';
  const targetDate = new Date('2024-01-15T12:00:00Z');
  const otherDate = new Date('2024-01-16T12:00:00Z');

  let testCat1Id: number;
  let testCat2Id: number;

  beforeEach(async () => {
    // Create test cats
    const cats = await db.insert(catsTable)
      .values([
        {
          name: 'Whiskers',
          breed: 'Tabby',
          age: 3,
          description: 'Very suspicious'
        },
        {
          name: 'Shadow',
          breed: 'Black Cat',
          age: 5,
          description: 'Master of stealth'
        }
      ])
      .returning()
      .execute();

    testCat1Id = cats[0].id;
    testCat2Id = cats[1].id;
  });

  it('should calculate conspiracy levels for all cats on a specific date', async () => {
    // Create activities for the target date
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: testCat1Id,
          activity_type: 'staring contest',
          description: 'Won against human',
          conspiracy_score: 8,
          recorded_at: targetDate
        },
        {
          cat_id: testCat1Id,
          activity_type: 'midnight zoomies',
          description: 'Running at 3 AM',
          conspiracy_score: 6,
          recorded_at: targetDate
        },
        {
          cat_id: testCat2Id,
          activity_type: 'gift giving',
          description: 'Left dead mouse on pillow',
          conspiracy_score: 9,
          recorded_at: targetDate
        }
      ])
      .execute();

    const input: GetDailyConspiracyInput = { date: testDate };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(2);

    // Check Whiskers (cat 1) - total score: 14
    const whiskers = result.find(r => r.cat_id === testCat1Id);
    expect(whiskers).toBeDefined();
    expect(whiskers!.cat_name).toBe('Whiskers');
    expect(whiskers!.total_conspiracy_score).toBe(14);
    expect(whiskers!.activity_count).toBe(2);
    expect(whiskers!.conspiracy_level).toBe('Mildly Suspicious');
    expect(whiskers!.date).toBe(testDate);

    // Check Shadow (cat 2) - total score: 9
    const shadow = result.find(r => r.cat_id === testCat2Id);
    expect(shadow).toBeDefined();
    expect(shadow!.cat_name).toBe('Shadow');
    expect(shadow!.total_conspiracy_score).toBe(9);
    expect(shadow!.activity_count).toBe(1);
    expect(shadow!.conspiracy_level).toBe('Mildly Suspicious');
    expect(shadow!.date).toBe(testDate);
  });

  it('should filter by specific cat when cat_id is provided', async () => {
    // Create activities for both cats
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: testCat1Id,
          activity_type: 'plotting',
          conspiracy_score: 7,
          recorded_at: targetDate
        },
        {
          cat_id: testCat2Id,
          activity_type: 'scheming',
          conspiracy_score: 8,
          recorded_at: targetDate
        }
      ])
      .execute();

    const input: GetDailyConspiracyInput = { 
      date: testDate, 
      cat_id: testCat1Id 
    };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toBe(testCat1Id);
    expect(result[0].cat_name).toBe('Whiskers');
    expect(result[0].total_conspiracy_score).toBe(7);
    expect(result[0].activity_count).toBe(1);
  });

  it('should return empty array when no activities exist for the date', async () => {
    // Create activity for different date
    await db.insert(activitiesTable)
      .values({
        cat_id: testCat1Id,
        activity_type: 'sleeping',
        conspiracy_score: 1,
        recorded_at: otherDate
      })
      .execute();

    const input: GetDailyConspiracyInput = { date: testDate };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(0);
  });

  it('should correctly assign conspiracy levels based on score ranges', async () => {
    // Create activities with different score ranges
    const testCases = [
      { score: 3, expectedLevel: 'Innocent Fluff Ball' },
      { score: 10, expectedLevel: 'Mildly Suspicious' },
      { score: 20, expectedLevel: 'Definitely Plotting Something' },
      { score: 30, expectedLevel: 'Cat Conspiracy in Progress' },
      { score: 40, expectedLevel: 'Plotting World Domination' }
    ];

    // Create additional cats for testing different levels
    const additionalCats = await db.insert(catsTable)
      .values(testCases.map((_, index) => ({
        name: `TestCat${index}`,
        breed: 'Test Breed'
      })))
      .returning()
      .execute();

    // Create activities for each test case
    const activities = testCases.map((testCase, index) => ({
      cat_id: additionalCats[index].id,
      activity_type: 'test activity',
      conspiracy_score: testCase.score,
      recorded_at: targetDate
    }));

    await db.insert(activitiesTable)
      .values(activities)
      .execute();

    const input: GetDailyConspiracyInput = { date: testDate };
    const result = await getDailyConspiracyLevel(input);

    // Verify each conspiracy level
    testCases.forEach((testCase, index) => {
      const catResult = result.find(r => r.cat_id === additionalCats[index].id);
      expect(catResult).toBeDefined();
      expect(catResult!.conspiracy_level).toBe(testCase.expectedLevel);
      expect(catResult!.total_conspiracy_score).toBe(testCase.score);
    });
  });

  it('should handle multiple activities for same cat correctly', async () => {
    // Create multiple activities for one cat on the same day
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: testCat1Id,
          activity_type: 'morning plotting',
          conspiracy_score: 5,
          recorded_at: new Date('2024-01-15T08:00:00Z')
        },
        {
          cat_id: testCat1Id,
          activity_type: 'afternoon scheming',
          conspiracy_score: 7,
          recorded_at: new Date('2024-01-15T15:00:00Z')
        },
        {
          cat_id: testCat1Id,
          activity_type: 'evening surveillance',
          conspiracy_score: 10,
          recorded_at: new Date('2024-01-15T20:00:00Z')
        }
      ])
      .execute();

    const input: GetDailyConspiracyInput = { date: testDate };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].cat_id).toBe(testCat1Id);
    expect(result[0].total_conspiracy_score).toBe(22); // 5 + 7 + 10
    expect(result[0].activity_count).toBe(3);
    expect(result[0].conspiracy_level).toBe('Definitely Plotting Something');
  });

  it('should only include activities from the specified date', async () => {
    const prevDay = new Date('2024-01-14T12:00:00Z');
    const nextDay = new Date('2024-01-16T12:00:00Z');

    // Create activities across different dates
    await db.insert(activitiesTable)
      .values([
        {
          cat_id: testCat1Id,
          activity_type: 'yesterday plotting',
          conspiracy_score: 5,
          recorded_at: prevDay
        },
        {
          cat_id: testCat1Id,
          activity_type: 'today plotting',
          conspiracy_score: 8,
          recorded_at: targetDate
        },
        {
          cat_id: testCat1Id,
          activity_type: 'tomorrow plotting',
          conspiracy_score: 6,
          recorded_at: nextDay
        }
      ])
      .execute();

    const input: GetDailyConspiracyInput = { date: testDate };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(1);
    expect(result[0].total_conspiracy_score).toBe(8); // Only today's activity
    expect(result[0].activity_count).toBe(1);
  });

  it('should return empty array for non-existent cat', async () => {
    const input: GetDailyConspiracyInput = { 
      date: testDate, 
      cat_id: 99999 // Non-existent cat ID
    };
    const result = await getDailyConspiracyLevel(input);

    expect(result).toHaveLength(0);
  });
});
