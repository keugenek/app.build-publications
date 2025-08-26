import { db } from '../db';
import { habitCheckinsTable } from '../db/schema';
import { type GetHabitStreakInput } from '../schema';
import { eq, desc } from 'drizzle-orm';

export type HabitStreakData = {
    habit_id: number;
    current_streak: number;
    longest_streak: number;
    completed_today: boolean;
    total_completions: number;
};

export async function getHabitStreak(input: GetHabitStreakInput): Promise<HabitStreakData> {
    try {
        // Get all checkins for the habit ordered by date (newest first)
        const checkins = await db.select()
            .from(habitCheckinsTable)
            .where(eq(habitCheckinsTable.habit_id, input.habit_id))
            .orderBy(desc(habitCheckinsTable.date))
            .execute();

        // Initialize result
        const result: HabitStreakData = {
            habit_id: input.habit_id,
            current_streak: 0,
            longest_streak: 0,
            completed_today: false,
            total_completions: 0
        };

        if (checkins.length === 0) {
            return result;
        }

        // Count total completions
        result.total_completions = checkins.filter(checkin => checkin.completed).length;

        // Get today's date in YYYY-MM-DD format
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Check if completed today
        const todayCheckin = checkins.find(checkin => checkin.date === todayStr);
        result.completed_today = todayCheckin?.completed ?? false;

        // Calculate current streak
        result.current_streak = calculateCurrentStreak(checkins, todayStr);

        // Calculate longest streak
        result.longest_streak = calculateLongestStreak(checkins);

        return result;
    } catch (error) {
        console.error('Failed to get habit streak:', error);
        throw error;
    }
}

function calculateCurrentStreak(checkins: Array<{ date: string; completed: boolean }>, todayStr: string): number {
    // Current streak rules:
    // 1. Current streak only counts if today is completed
    // 2. If today is completed, count consecutive completed days backwards from today
    // 3. If today is not completed (either explicitly false or no checkin), no current streak
    
    // Check today's status
    const todayCheckin = checkins.find(c => c.date === todayStr);
    const todayCompleted = todayCheckin?.completed === true;
    
    if (!todayCompleted) {
        return 0; // No current streak if today is not completed
    }
    
    // Count consecutive completed days backwards from today
    const completedCheckins = checkins.filter(c => c.completed);
    let streak = 0;
    let checkDate = new Date(todayStr);
    
    while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        const hasCompletion = completedCheckins.some(c => c.date === dateStr);
        
        if (hasCompletion) {
            streak++;
        } else {
            break; // Break on first non-completed day
        }
        
        // Move to previous day
        checkDate.setDate(checkDate.getDate() - 1);
        
        // Safety check to prevent infinite loop
        const daysDiff = Math.floor((new Date(todayStr).getTime() - checkDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff > 1000) break;
    }
    
    return streak;
}

function calculateLongestStreak(checkins: Array<{ date: string; completed: boolean }>): number {
    if (checkins.length === 0) return 0;
    
    // Sort checkins by date (oldest first)
    const sortedCheckins = [...checkins]
        .filter(c => c.completed) // Only consider completed checkins
        .sort((a, b) => a.date.localeCompare(b.date));
    
    if (sortedCheckins.length === 0) return 0;
    
    let longestStreak = 1;
    let currentStreak = 1;
    
    for (let i = 1; i < sortedCheckins.length; i++) {
        const prevDate = new Date(sortedCheckins[i - 1].date);
        const currentDate = new Date(sortedCheckins[i].date);
        
        // Calculate days difference
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
            // Consecutive day
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
        } else {
            // Non-consecutive, reset current streak
            currentStreak = 1;
        }
    }
    
    return longestStreak;
}
