import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { catProfilesTable, catActivityLogsTable, dailyConspiracySummariesTable } from '../db/schema';
import { type LogCatActivityInput } from '../schema';
import { logCatActivity } from '../handlers/log_cat_activity';
import { eq, and } from 'drizzle-orm';

describe('logCatActivity', () => {
    let testCatId: number;

    beforeEach(async () => {
        await createDB();
        
        // Create a test cat profile
        const catResult = await db.insert(catProfilesTable)
            .values({
                name: 'Test Cat',
                breed: 'Tabby',
                color: 'Orange',
                age_years: 3,
                suspicion_level: 'medium'
            })
            .returning()
            .execute();
        
        testCatId = catResult[0].id;
    });

    afterEach(resetDB);

    it('should log a cat activity with correct conspiracy points', async () => {
        const testInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'prolonged_staring',
            description: 'Staring at the wall for 10 minutes',
            occurred_at: new Date('2023-11-15T10:30:00Z')
        };

        const result = await logCatActivity(testInput);

        expect(result.cat_id).toBe(testCatId);
        expect(result.activity_type).toBe('prolonged_staring');
        expect(result.description).toBe('Staring at the wall for 10 minutes');
        expect(result.conspiracy_points).toBe(15);
        expect(result.occurred_at).toEqual(new Date('2023-11-15T10:30:00Z'));
        expect(result.logged_at).toBeInstanceOf(Date);
        expect(result.id).toBeDefined();
    });

    it('should use current time when occurred_at is not provided', async () => {
        const testInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'midnight_meetings',
            description: null
        };

        const beforeTime = new Date();
        const result = await logCatActivity(testInput);
        const afterTime = new Date();

        expect(result.occurred_at).toBeInstanceOf(Date);
        expect(result.occurred_at.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
        expect(result.occurred_at.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should save activity to database', async () => {
        const testInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'bringing_gifts',
            description: 'Brought a dead mouse',
            occurred_at: new Date('2023-11-15T08:00:00Z')
        };

        const result = await logCatActivity(testInput);

        const activities = await db.select()
            .from(catActivityLogsTable)
            .where(eq(catActivityLogsTable.id, result.id))
            .execute();

        expect(activities).toHaveLength(1);
        expect(activities[0].cat_id).toBe(testCatId);
        expect(activities[0].activity_type).toBe('bringing_gifts');
        expect(activities[0].conspiracy_points).toBe(25);
        expect(activities[0].occurred_at).toEqual(new Date('2023-11-15T08:00:00Z'));
    });

    it('should create new daily conspiracy summary', async () => {
        const testInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'vocalizing_at_objects',
            description: null,
            occurred_at: new Date('2023-11-15T12:00:00Z')
        };

        await logCatActivity(testInput);

        const summaries = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, testCatId),
                eq(dailyConspiracySummariesTable.date, '2023-11-15')
            ))
            .execute();

        expect(summaries).toHaveLength(1);
        expect(summaries[0].total_conspiracy_points).toBe(20);
        expect(summaries[0].activity_count).toBe(1);
        expect(summaries[0].conspiracy_level).toBe('suspicious');
    });

    it('should update existing daily conspiracy summary', async () => {
        const firstInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'sitting_in_boxes',
            description: 'Found in Amazon box',
            occurred_at: new Date('2023-11-15T09:00:00Z')
        };

        const secondInput: LogCatActivityInput = {
            cat_id: testCatId,
            activity_type: 'knocking_items',
            description: 'Knocked over water glass',
            occurred_at: new Date('2023-11-15T15:00:00Z')
        };

        await logCatActivity(firstInput);
        await logCatActivity(secondInput);

        const summaries = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, testCatId),
                eq(dailyConspiracySummariesTable.date, '2023-11-15')
            ))
            .execute();

        expect(summaries).toHaveLength(1);
        expect(summaries[0].total_conspiracy_points).toBe(15); // 5 + 10
        expect(summaries[0].activity_count).toBe(2);
        expect(summaries[0].conspiracy_level).toBe('suspicious');
    });

    it('should calculate correct conspiracy levels', async () => {
        // Test innocent level (≤10 points)
        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'ignoring_humans',
            description: null,
            occurred_at: new Date('2023-11-15T10:00:00Z')
        });

        let summary = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, testCatId),
                eq(dailyConspiracySummariesTable.date, '2023-11-15')
            ))
            .execute();

        expect(summary[0].conspiracy_level).toBe('innocent');

        // Add more points to reach suspicious level (11-30 points)
        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'knocking_items',
            description: null,
            occurred_at: new Date('2023-11-15T11:00:00Z')
        });

        summary = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, testCatId),
                eq(dailyConspiracySummariesTable.date, '2023-11-15')
            ))
            .execute();

        expect(summary[0].conspiracy_level).toBe('suspicious');
        expect(summary[0].total_conspiracy_points).toBe(16); // 6 + 10
    });

    it('should handle high conspiracy levels correctly', async () => {
        // Add activities to reach plotting level (31-60 points)
        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'midnight_meetings',
            description: null,
            occurred_at: new Date('2023-11-15T10:00:00Z')
        });

        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'bringing_gifts',
            description: null,
            occurred_at: new Date('2023-11-15T11:00:00Z')
        });

        const summary = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(and(
                eq(dailyConspiracySummariesTable.cat_id, testCatId),
                eq(dailyConspiracySummariesTable.date, '2023-11-15')
            ))
            .execute();

        expect(summary[0].conspiracy_level).toBe('plotting');
        expect(summary[0].total_conspiracy_points).toBe(55); // 30 + 25
    });

    it('should handle activities on different dates separately', async () => {
        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'prolonged_staring',
            description: null,
            occurred_at: new Date('2023-11-15T10:00:00Z')
        });

        await logCatActivity({
            cat_id: testCatId,
            activity_type: 'prolonged_staring',
            description: null,
            occurred_at: new Date('2023-11-16T10:00:00Z')
        });

        const summaries = await db.select()
            .from(dailyConspiracySummariesTable)
            .where(eq(dailyConspiracySummariesTable.cat_id, testCatId))
            .execute();

        expect(summaries).toHaveLength(2);
        
        const nov15Summary = summaries.find(s => s.date === '2023-11-15');
        const nov16Summary = summaries.find(s => s.date === '2023-11-16');
        
        expect(nov15Summary?.total_conspiracy_points).toBe(15);
        expect(nov16Summary?.total_conspiracy_points).toBe(15);
        expect(nov15Summary?.activity_count).toBe(1);
        expect(nov16Summary?.activity_count).toBe(1);
    });

    it('should throw error for non-existent cat', async () => {
        const testInput: LogCatActivityInput = {
            cat_id: 99999,
            activity_type: 'prolonged_staring',
            description: null
        };

        await expect(logCatActivity(testInput)).rejects.toThrow(/Cat with ID 99999 does not exist/);
    });

    it('should handle all activity types with correct conspiracy points', async () => {
        const activityTypes = [
            { type: 'prolonged_staring', expectedPoints: 15 },
            { type: 'bringing_gifts', expectedPoints: 25 },
            { type: 'knocking_items', expectedPoints: 10 },
            { type: 'sudden_zoomies', expectedPoints: 8 },
            { type: 'vocalizing_at_objects', expectedPoints: 20 },
            { type: 'hiding_under_furniture', expectedPoints: 12 },
            { type: 'sitting_in_boxes', expectedPoints: 5 },
            { type: 'midnight_meetings', expectedPoints: 30 },
            { type: 'suspicious_purring', expectedPoints: 18 },
            { type: 'ignoring_humans', expectedPoints: 6 }
        ] as const;

        for (const activity of activityTypes) {
            const result = await logCatActivity({
                cat_id: testCatId,
                activity_type: activity.type,
                description: null,
                occurred_at: new Date(`2023-11-${activityTypes.indexOf(activity) + 1}T10:00:00Z`)
            });

            expect(result.conspiracy_points).toBe(activity.expectedPoints);
        }
    });
});
