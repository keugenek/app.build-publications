import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { eq, sum, count } from 'drizzle-orm';
import { type SessionType } from '../schema';

export interface SessionStats {
    totalSessions: number;
    workSessions: number;
    breakSessions: number;
    totalWorkMinutes: number;
    totalBreakMinutes: number;
}

export async function getSessionStats(): Promise<SessionStats> {
    try {
        // Get aggregated statistics from the database
        const results = await db.select({
            type: sessionsTable.type,
            sessionCount: count(sessionsTable.id),
            totalDuration: sum(sessionsTable.duration)
        })
        .from(sessionsTable)
        .groupBy(sessionsTable.type)
        .execute();

        // Initialize stats with default values
        let totalSessions = 0;
        let workSessions = 0;
        let breakSessions = 0;
        let totalWorkMinutes = 0;
        let totalBreakMinutes = 0;

        // Process the results
        for (const result of results) {
            const sessionCount = Number(result.sessionCount);
            const duration = Number(result.totalDuration) || 0;

            totalSessions += sessionCount;

            if (result.type === 'work') {
                workSessions = sessionCount;
                totalWorkMinutes = duration;
            } else if (result.type === 'break') {
                breakSessions = sessionCount;
                totalBreakMinutes = duration;
            }
        }

        return {
            totalSessions,
            workSessions,
            breakSessions,
            totalWorkMinutes,
            totalBreakMinutes
        };
    } catch (error) {
        console.error('Session stats calculation failed:', error);
        throw error;
    }
}
