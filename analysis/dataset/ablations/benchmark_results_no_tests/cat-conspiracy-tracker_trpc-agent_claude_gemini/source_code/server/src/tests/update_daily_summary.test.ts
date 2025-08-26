import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable, catActivityLogsTable, dailyConspiracySummariesTable } from '../db/schema';
import { updateDailySummary } from '../handlers/update_daily_summary';
import { eq, and } from 'drizzle-orm';

describe('updateDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create new daily summary when none exists', async () => {
    // Create test cat
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Test Cat',
        suspicion_level: 'medium'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const testDate = '2024-01-15';

    // Create some activities for the date
    const startOfDay = new Date('2024-01-15T10:00:00.000Z');
    const midDay = new Date('2024-01-15T14:00:00.000Z');

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'prolonged_staring',
          conspiracy_points: 15,
          occurred_at: startOfDay
        },
        {
          cat_id: catId,
          activity_type: 'bringing_gifts',
          conspiracy_points: 25,
          occurred_at: midDay
        }
      ])
      .execute();

    // Update daily summary
    const result = await updateDailySummary(catId, testDate);

    // Verify the created summary
    expect(result.cat_id).toBe(catId);
    expect(result.date).toBe(testDate);
    expect(result.total_conspiracy_points).toBe(40); // 15 + 25
    expect(result.activity_count).toBe(2);
    expect(result.conspiracy_level).toBe('suspicious'); // 40 points = suspicious level
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update existing daily summary', async () => {
    // Create test cat
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Test Cat',
        suspicion_level: 'high'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const testDate = '2024-01-15';

    // Create initial activities
    const startOfDay = new Date('2024-01-15T08:00:00.000Z');
    await db.insert(catActivityLogsTable)
      .values({
        cat_id: catId,
        activity_type: 'knocking_items',
        conspiracy_points: 10,
        occurred_at: startOfDay
      })
      .execute();

    // Create initial summary
    const initialSummary = await db.insert(dailyConspiracySummariesTable)
      .values({
        cat_id: catId,
        date: testDate,
        total_conspiracy_points: 10,
        conspiracy_level: 'innocent',
        activity_count: 1
      })
      .returning()
      .execute();

    // Add more activities
    const laterTime = new Date('2024-01-15T16:00:00.000Z');
    await db.insert(catActivityLogsTable)
      .values({
        cat_id: catId,
        activity_type: 'midnight_meetings',
        conspiracy_points: 30,
        occurred_at: laterTime
      })
      .execute();

    // Update daily summary
    const result = await updateDailySummary(catId, testDate);

    // Verify the summary was updated (not created new)
    expect(result.id).toBe(initialSummary[0].id);
    expect(result.cat_id).toBe(catId);
    expect(result.date).toBe(testDate);
    expect(result.total_conspiracy_points).toBe(40); // 10 + 30
    expect(result.activity_count).toBe(2);
    expect(result.conspiracy_level).toBe('suspicious'); // 40 points = suspicious level

    // Verify only one summary exists in database
    const summaries = await db.select()
      .from(dailyConspiracySummariesTable)
      .where(
        and(
          eq(dailyConspiracySummariesTable.cat_id, catId),
          eq(dailyConspiracySummariesTable.date, testDate)
        )
      )
      .execute();

    expect(summaries).toHaveLength(1);
  });

  it('should handle date with no activities', async () => {
    // Create test cat
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Inactive Cat',
        suspicion_level: 'low'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const testDate = '2024-01-15';

    // Update daily summary for date with no activities
    const result = await updateDailySummary(catId, testDate);

    // Verify summary with zero values
    expect(result.cat_id).toBe(catId);
    expect(result.date).toBe(testDate);
    expect(result.total_conspiracy_points).toBe(0);
    expect(result.activity_count).toBe(0);
    expect(result.conspiracy_level).toBe('innocent'); // 0 points = innocent level
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should only include activities from specified date', async () => {
    // Create test cat
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Time-specific Cat',
        suspicion_level: 'medium'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const testDate = '2024-01-15';

    // Create activities on different dates
    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'prolonged_staring',
          conspiracy_points: 15,
          occurred_at: new Date('2024-01-14T23:59:59.000Z') // Day before
        },
        {
          cat_id: catId,
          activity_type: 'bringing_gifts',
          conspiracy_points: 25,
          occurred_at: new Date('2024-01-15T10:00:00.000Z') // Target date
        },
        {
          cat_id: catId,
          activity_type: 'knocking_items',
          conspiracy_points: 10,
          occurred_at: new Date('2024-01-15T23:59:59.000Z') // Target date (end of day)
        },
        {
          cat_id: catId,
          activity_type: 'sudden_zoomies',
          conspiracy_points: 8,
          occurred_at: new Date('2024-01-16T00:00:00.000Z') // Day after
        }
      ])
      .execute();

    // Update daily summary for specific date
    const result = await updateDailySummary(catId, testDate);

    // Should only include activities from 2024-01-15
    expect(result.total_conspiracy_points).toBe(35); // 25 + 10 (not 15 or 8)
    expect(result.activity_count).toBe(2);
    expect(result.conspiracy_level).toBe('suspicious');
  });

  it('should calculate correct conspiracy levels', async () => {
    // Create test cat
    const catResult = await db.insert(catProfilesTable)
      .values({
        name: 'Level Test Cat',
        suspicion_level: 'maximum'
      })
      .returning()
      .execute();

    const catId = catResult[0].id;
    const testDate = '2024-01-15';

    // Test different conspiracy levels
    const testCases: Array<{points: number, expectedLevel: 'innocent' | 'suspicious' | 'plotting' | 'dangerous' | 'world_domination'}> = [
      { points: 0, expectedLevel: 'innocent' },
      { points: 15, expectedLevel: 'innocent' }, // 0-20 points
      { points: 35, expectedLevel: 'suspicious' }, // 21-50 points
      { points: 75, expectedLevel: 'plotting' }, // 51-100 points
      { points: 125, expectedLevel: 'dangerous' }, // 101-150 points
      { points: 200, expectedLevel: 'world_domination' } // 151+ points
    ];

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const specificDate = `2024-01-${(16 + i).toString().padStart(2, '0')}`;

      // Create activity with specific points
      await db.insert(catActivityLogsTable)
        .values({
          cat_id: catId,
          activity_type: 'prolonged_staring',
          conspiracy_points: testCase.points,
          occurred_at: new Date(specificDate + 'T12:00:00.000Z')
        })
        .execute();

      // Update summary and verify level
      const result = await updateDailySummary(catId, specificDate);
      expect(result.conspiracy_level).toBe(testCase.expectedLevel);
      expect(result.total_conspiracy_points).toBe(testCase.points);
    }
  });

  it('should handle multiple cats independently', async () => {
    // Create two test cats
    const cat1Result = await db.insert(catProfilesTable)
      .values({
        name: 'Cat One',
        suspicion_level: 'low'
      })
      .returning()
      .execute();

    const cat2Result = await db.insert(catProfilesTable)
      .values({
        name: 'Cat Two',
        suspicion_level: 'high'
      })
      .returning()
      .execute();

    const cat1Id = cat1Result[0].id;
    const cat2Id = cat2Result[0].id;
    const testDate = '2024-01-15';

    // Create different activities for each cat
    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: cat1Id,
          activity_type: 'sitting_in_boxes',
          conspiracy_points: 5,
          occurred_at: new Date('2024-01-15T10:00:00.000Z')
        },
        {
          cat_id: cat2Id,
          activity_type: 'midnight_meetings',
          conspiracy_points: 30,
          occurred_at: new Date('2024-01-15T10:00:00.000Z')
        }
      ])
      .execute();

    // Update summaries for both cats
    const cat1Summary = await updateDailySummary(cat1Id, testDate);
    const cat2Summary = await updateDailySummary(cat2Id, testDate);

    // Verify independent calculations
    expect(cat1Summary.cat_id).toBe(cat1Id);
    expect(cat1Summary.total_conspiracy_points).toBe(5);
    expect(cat1Summary.conspiracy_level).toBe('innocent');

    expect(cat2Summary.cat_id).toBe(cat2Id);
    expect(cat2Summary.total_conspiracy_points).toBe(30);
    expect(cat2Summary.conspiracy_level).toBe('suspicious');

    // Verify separate database entries
    const allSummaries = await db.select()
      .from(dailyConspiracySummariesTable)
      .where(eq(dailyConspiracySummariesTable.date, testDate))
      .execute();

    expect(allSummaries).toHaveLength(2);
  });
});
