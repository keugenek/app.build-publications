import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { habitsTable, habitCheckinsTable } from '../db/schema';
import { type GetHabitStreakInput } from '../schema';
import { getHabitStreak } from '../handlers/get_habit_streak';

describe('getHabitStreak', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let habitId: number;

    beforeEach(async () => {
        // Create a test habit
        const habitResult = await db.insert(habitsTable)
            .values({
                name: 'Test Habit',
                description: 'A habit for testing'
            })
            .returning()
            .execute();
        
        habitId = habitResult[0].id;
    });

    it('should return empty streak data for habit with no checkins', async () => {
        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(0);
        expect(result.longest_streak).toBe(0);
        expect(result.completed_today).toBe(false);
        expect(result.total_completions).toBe(0);
    });

    it('should calculate correct streak for habit completed today', async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Create checkin for today
        await db.insert(habitCheckinsTable)
            .values({
                habit_id: habitId,
                date: today,
                completed: true
            })
            .execute();

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(1);
        expect(result.longest_streak).toBe(1);
        expect(result.completed_today).toBe(true);
        expect(result.total_completions).toBe(1);
    });

    it('should calculate correct streak for consecutive days', async () => {
        const today = new Date();
        const dates: string[] = [];
        
        // Create 5 consecutive days of completed checkins (including today)
        for (let i = 4; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            dates.push(dateStr);
            
            await db.insert(habitCheckinsTable)
                .values({
                    habit_id: habitId,
                    date: dateStr,
                    completed: true
                })
                .execute();
        }

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(5);
        expect(result.longest_streak).toBe(5);
        expect(result.completed_today).toBe(true);
        expect(result.total_completions).toBe(5);
    });

    it('should handle broken streaks correctly', async () => {
        const today = new Date();
        const dates = [];
        
        // Create pattern: completed, completed, missed, completed, completed (today)
        for (let i = 4; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const completed = i !== 2; // Miss the day 2 days ago
            
            await db.insert(habitCheckinsTable)
                .values({
                    habit_id: habitId,
                    date: dateStr,
                    completed: completed
                })
                .execute();
        }

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(2); // Today + yesterday
        expect(result.longest_streak).toBe(2); // Either the first 2 days or last 2 days
        expect(result.completed_today).toBe(true);
        expect(result.total_completions).toBe(4); // 4 out of 5 days
    });

    it('should calculate longest streak correctly with multiple streaks', async () => {
        const today = new Date();
        
        // Create pattern: 3 days, gap, 5 days, gap, 2 days (including today)
        // Only insert records for completed days and explicit gaps
        const patterns = [
            { daysAgo: 12, completed: true },  // Start of first streak
            { daysAgo: 11, completed: true },
            { daysAgo: 10, completed: true },  // End of first streak (3 days)
            { daysAgo: 8, completed: true },   // Start of second streak (gap at day 9)
            { daysAgo: 7, completed: true },
            { daysAgo: 6, completed: true },
            { daysAgo: 5, completed: true },
            { daysAgo: 4, completed: true },   // End of second streak (5 days)
            { daysAgo: 1, completed: true },   // Start of third streak (gap at days 3,2)
            { daysAgo: 0, completed: true },   // Today (2 days total)
        ];
        
        for (const pattern of patterns) {
            const date = new Date(today);
            date.setDate(date.getDate() - pattern.daysAgo);
            const dateStr = date.toISOString().split('T')[0];
            
            await db.insert(habitCheckinsTable)
                .values({
                    habit_id: habitId,
                    date: dateStr,
                    completed: pattern.completed
                })
                .execute();
        }

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(2); // Yesterday + today
        expect(result.longest_streak).toBe(5); // The middle streak
        expect(result.completed_today).toBe(true);
        expect(result.total_completions).toBe(10); // Count of true values
    });

    it('should handle habit not completed today but has previous streak', async () => {
        const today = new Date();
        
        // Create checkins for 2 days ago and 3 days ago, but not today or yesterday
        for (let i = 3; i >= 2; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            await db.insert(habitCheckinsTable)
                .values({
                    habit_id: habitId,
                    date: dateStr,
                    completed: true
                })
                .execute();
        }

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(0); // No current streak since not completed today or yesterday
        expect(result.longest_streak).toBe(2); // Previous streak
        expect(result.completed_today).toBe(false);
        expect(result.total_completions).toBe(2);
    });

    it('should handle incomplete checkins correctly', async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // Create both completed and incomplete checkins
        await db.insert(habitCheckinsTable)
            .values([
                {
                    habit_id: habitId,
                    date: today,
                    completed: false // Not completed today
                },
                {
                    habit_id: habitId,
                    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
                    completed: true // Completed yesterday
                }
            ])
            .execute();

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(0); // No current streak since today is not completed
        expect(result.longest_streak).toBe(1); // Yesterday only
        expect(result.completed_today).toBe(false);
        expect(result.total_completions).toBe(1); // Only yesterday counts
    });

    it('should handle non-existent habit', async () => {
        const input: GetHabitStreakInput = { habit_id: 99999 };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(99999);
        expect(result.current_streak).toBe(0);
        expect(result.longest_streak).toBe(0);
        expect(result.completed_today).toBe(false);
        expect(result.total_completions).toBe(0);
    });

    it('should handle single day completion correctly', async () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        // Only completed yesterday, not today
        await db.insert(habitCheckinsTable)
            .values({
                habit_id: habitId,
                date: yesterdayStr,
                completed: true
            })
            .execute();

        const input: GetHabitStreakInput = { habit_id: habitId };
        const result = await getHabitStreak(input);

        expect(result.habit_id).toBe(habitId);
        expect(result.current_streak).toBe(0); // No current streak
        expect(result.longest_streak).toBe(1); // One day streak
        expect(result.completed_today).toBe(false);
        expect(result.total_completions).toBe(1);
    });
});
