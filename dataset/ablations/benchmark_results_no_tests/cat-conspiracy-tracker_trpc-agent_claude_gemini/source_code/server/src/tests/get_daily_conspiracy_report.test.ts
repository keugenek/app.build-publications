import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable, catActivityLogsTable } from '../db/schema';
import { type GetDailySummaryInput, type CreateCatProfileInput } from '../schema';
import { getDailyConspiracyReport } from '../handlers/get_daily_conspiracy_report';

// Test data
const testCatProfile: CreateCatProfileInput = {
  name: 'Whiskers',
  breed: 'Persian',
  color: 'Gray',
  age_years: 3,
  suspicion_level: 'medium'
};

const testDate = '2024-01-15';

describe('getDailyConspiracyReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate report for innocent cat (no activities)', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.cat_name).toEqual('Whiskers');
    expect(result.date).toEqual(testDate);
    expect(result.total_conspiracy_points).toEqual(0);
    expect(result.conspiracy_level).toEqual('innocent');
    expect(result.activities).toHaveLength(0);
    expect(result.level_description).toContain('behaving normally');
  });

  it('should generate report for suspicious cat (11-30 points)', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activities for the test date (total: 20 points)
    const testDateTime1 = new Date(`${testDate}T10:00:00.000Z`);
    const testDateTime2 = new Date(`${testDate}T15:30:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'knocking_items', // 12 points
          description: 'Knocked over water glass',
          conspiracy_points: 12,
          occurred_at: testDateTime1
        },
        {
          cat_id: catId,
          activity_type: 'prolonged_staring', // 8 points
          description: 'Stared at wall for 10 minutes',
          conspiracy_points: 8,
          occurred_at: testDateTime2
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.cat_name).toEqual('Whiskers');
    expect(result.date).toEqual(testDate);
    expect(result.total_conspiracy_points).toEqual(20);
    expect(result.conspiracy_level).toEqual('suspicious');
    expect(result.activities).toHaveLength(2);
    expect(result.level_description).toContain('questionable activities');

    // Verify activity details
    const knockingActivity = result.activities.find(a => a.activity_type === 'knocking_items');
    expect(knockingActivity).toBeDefined();
    expect(knockingActivity!.conspiracy_points).toEqual(12);
    expect(knockingActivity!.description).toEqual('Knocked over water glass');

    const staringActivity = result.activities.find(a => a.activity_type === 'prolonged_staring');
    expect(staringActivity).toBeDefined();
    expect(staringActivity!.conspiracy_points).toEqual(8);
  });

  it('should generate report for plotting cat (31-60 points)', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activities for the test date (total: 50 points)
    const testDateTime = new Date(`${testDate}T14:00:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'bringing_gifts', // 15 points
          description: 'Brought dead mouse',
          conspiracy_points: 15,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'bringing_gifts', // 15 points
          description: 'Brought dead bird',
          conspiracy_points: 15,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Met with neighborhood cats',
          conspiracy_points: 20,
          occurred_at: testDateTime
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.total_conspiracy_points).toEqual(50);
    expect(result.conspiracy_level).toEqual('plotting');
    expect(result.activities).toHaveLength(3);
    expect(result.level_description).toContain('signs of conspiracy');
  });

  it('should generate report for dangerous cat (61-100 points)', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: 'Destroyer',
        breed: 'Maine Coon',
        color: 'Black',
        age_years: 5,
        suspicion_level: 'maximum'
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activities for the test date (total: 80 points)
    const testDateTime = new Date(`${testDate}T12:00:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Organized cat gathering',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Second secret meeting',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Third meeting with allies',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Final planning session',
          conspiracy_points: 20,
          occurred_at: testDateTime
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.cat_name).toEqual('Destroyer');
    expect(result.total_conspiracy_points).toEqual(80);
    expect(result.conspiracy_level).toEqual('dangerous');
    expect(result.activities).toHaveLength(4);
    expect(result.level_description).toContain('High alert');
  });

  it('should generate report for world domination cat (101+ points)', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: 'Evil Overlord',
        breed: 'Siamese',
        color: 'Cream',
        age_years: 7,
        suspicion_level: 'maximum'
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activities for the test date (total: 120 points)
    const testDateTime = new Date(`${testDate}T18:00:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Grand assembly of all cats',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Strategic planning session',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Resource allocation meeting',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Final preparation meeting',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Execution briefing',
          conspiracy_points: 20,
          occurred_at: testDateTime
        },
        {
          cat_id: catId,
          activity_type: 'midnight_meetings', // 20 points
          description: 'Launch coordination',
          conspiracy_points: 20,
          occurred_at: testDateTime
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.cat_name).toEqual('Evil Overlord');
    expect(result.total_conspiracy_points).toEqual(120);
    expect(result.conspiracy_level).toEqual('world_domination');
    expect(result.activities).toHaveLength(6);
    expect(result.level_description).toContain('MAXIMUM THREAT LEVEL');
    expect(result.level_description).toContain('world domination');
  });

  it('should filter activities by exact date', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activities for different dates
    const targetDate = new Date(`${testDate}T12:00:00.000Z`);
    const dayBefore = new Date(`2024-01-14T12:00:00.000Z`);
    const dayAfter = new Date(`2024-01-16T12:00:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values([
        {
          cat_id: catId,
          activity_type: 'knocking_items',
          description: 'Target date activity',
          conspiracy_points: 12,
          occurred_at: targetDate
        },
        {
          cat_id: catId,
          activity_type: 'prolonged_staring',
          description: 'Day before activity',
          conspiracy_points: 8,
          occurred_at: dayBefore
        },
        {
          cat_id: catId,
          activity_type: 'suspicious_purring',
          description: 'Day after activity',
          conspiracy_points: 7,
          occurred_at: dayAfter
        }
      ])
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.total_conspiracy_points).toEqual(12);
    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].description).toEqual('Target date activity');
  });

  it('should throw error for non-existent cat', async () => {
    const input: GetDailySummaryInput = {
      cat_id: 9999,
      date: testDate
    };

    await expect(getDailyConspiracyReport(input)).rejects.toThrow(/Cat with ID 9999 not found/);
  });

  it('should handle activities with null descriptions', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add activity with null description
    const testDateTime = new Date(`${testDate}T09:00:00.000Z`);

    await db.insert(catActivityLogsTable)
      .values({
        cat_id: catId,
        activity_type: 'sitting_in_boxes',
        description: null,
        conspiracy_points: 4,
        occurred_at: testDateTime
      })
      .execute();

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    expect(result.activities).toHaveLength(1);
    expect(result.activities[0].description).toBeNull();
    expect(result.activities[0].conspiracy_points).toEqual(4);
    expect(result.total_conspiracy_points).toEqual(4);
  });

  it('should correctly calculate conspiracy points for all activity types', async () => {
    // Create a cat profile
    const catResults = await db.insert(catProfilesTable)
      .values({
        name: testCatProfile.name,
        breed: testCatProfile.breed,
        color: testCatProfile.color,
        age_years: testCatProfile.age_years,
        suspicion_level: testCatProfile.suspicion_level
      })
      .returning()
      .execute();

    const catId = catResults[0].id;

    // Add one activity of each type
    const testDateTime = new Date(`${testDate}T11:00:00.000Z`);

    const allActivityTypes = [
      'prolonged_staring',    // 8 points
      'bringing_gifts',       // 15 points
      'knocking_items',       // 12 points
      'sudden_zoomies',       // 6 points
      'vocalizing_at_objects', // 10 points
      'hiding_under_furniture', // 9 points
      'sitting_in_boxes',     // 4 points
      'midnight_meetings',    // 20 points
      'suspicious_purring',   // 7 points
      'ignoring_humans'       // 5 points
    ];

    for (const activityType of allActivityTypes) {
      await db.insert(catActivityLogsTable)
        .values({
          cat_id: catId,
          activity_type: activityType as any,
          description: `Test ${activityType}`,
          conspiracy_points: 0, // Will be overridden by handler logic
          occurred_at: testDateTime
        })
        .execute();
    }

    const input: GetDailySummaryInput = {
      cat_id: catId,
      date: testDate
    };

    const result = await getDailyConspiracyReport(input);

    // Expected total: 8+15+12+6+10+9+4+20+7+5 = 96 points
    expect(result.total_conspiracy_points).toEqual(96);
    expect(result.conspiracy_level).toEqual('dangerous');
    expect(result.activities).toHaveLength(10);

    // Verify specific point values
    const midnightMeetingActivity = result.activities.find(a => a.activity_type === 'midnight_meetings');
    expect(midnightMeetingActivity!.conspiracy_points).toEqual(20);

    const bringingGiftsActivity = result.activities.find(a => a.activity_type === 'bringing_gifts');
    expect(bringingGiftsActivity!.conspiracy_points).toEqual(15);

    const sittingInBoxesActivity = result.activities.find(a => a.activity_type === 'sitting_in_boxes');
    expect(sittingInBoxesActivity!.conspiracy_points).toEqual(4);
  });
});
