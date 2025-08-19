import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { sessionsTable } from '../db/schema';
import { getSessionStats, type SessionStats } from '../handlers/get_session_stats';

describe('getSessionStats', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return empty stats when no sessions exist', async () => {
        const stats = await getSessionStats();

        expect(stats).toEqual({
            totalSessions: 0,
            workSessions: 0,
            breakSessions: 0,
            totalWorkMinutes: 0,
            totalBreakMinutes: 0
        });
    });

    it('should calculate stats for work sessions only', async () => {
        // Insert work sessions
        await db.insert(sessionsTable)
            .values([
                { type: 'work', duration: 25 },
                { type: 'work', duration: 30 },
                { type: 'work', duration: 20 }
            ])
            .execute();

        const stats = await getSessionStats();

        expect(stats.totalSessions).toBe(3);
        expect(stats.workSessions).toBe(3);
        expect(stats.breakSessions).toBe(0);
        expect(stats.totalWorkMinutes).toBe(75);
        expect(stats.totalBreakMinutes).toBe(0);
    });

    it('should calculate stats for break sessions only', async () => {
        // Insert break sessions
        await db.insert(sessionsTable)
            .values([
                { type: 'break', duration: 5 },
                { type: 'break', duration: 10 },
                { type: 'break', duration: 15 }
            ])
            .execute();

        const stats = await getSessionStats();

        expect(stats.totalSessions).toBe(3);
        expect(stats.workSessions).toBe(0);
        expect(stats.breakSessions).toBe(3);
        expect(stats.totalWorkMinutes).toBe(0);
        expect(stats.totalBreakMinutes).toBe(30);
    });

    it('should calculate combined stats for work and break sessions', async () => {
        // Insert mixed sessions
        await db.insert(sessionsTable)
            .values([
                { type: 'work', duration: 25 },
                { type: 'break', duration: 5 },
                { type: 'work', duration: 25 },
                { type: 'break', duration: 5 },
                { type: 'work', duration: 25 },
                { type: 'break', duration: 15 }
            ])
            .execute();

        const stats = await getSessionStats();

        expect(stats.totalSessions).toBe(6);
        expect(stats.workSessions).toBe(3);
        expect(stats.breakSessions).toBe(3);
        expect(stats.totalWorkMinutes).toBe(75);
        expect(stats.totalBreakMinutes).toBe(25);
    });

    it('should handle single session correctly', async () => {
        // Insert single work session
        await db.insert(sessionsTable)
            .values([{ type: 'work', duration: 45 }])
            .execute();

        const stats = await getSessionStats();

        expect(stats.totalSessions).toBe(1);
        expect(stats.workSessions).toBe(1);
        expect(stats.breakSessions).toBe(0);
        expect(stats.totalWorkMinutes).toBe(45);
        expect(stats.totalBreakMinutes).toBe(0);
    });

    it('should handle sessions with varying durations', async () => {
        // Insert sessions with different durations
        await db.insert(sessionsTable)
            .values([
                { type: 'work', duration: 15 },
                { type: 'work', duration: 45 },
                { type: 'work', duration: 60 },
                { type: 'break', duration: 5 },
                { type: 'break', duration: 30 }
            ])
            .execute();

        const stats = await getSessionStats();

        expect(stats.totalSessions).toBe(5);
        expect(stats.workSessions).toBe(3);
        expect(stats.breakSessions).toBe(2);
        expect(stats.totalWorkMinutes).toBe(120);
        expect(stats.totalBreakMinutes).toBe(35);
    });

    it('should verify stats are calculated from database data', async () => {
        // Insert initial sessions
        await db.insert(sessionsTable)
            .values([
                { type: 'work', duration: 25 },
                { type: 'break', duration: 5 }
            ])
            .execute();

        const initialStats = await getSessionStats();
        expect(initialStats.totalSessions).toBe(2);
        expect(initialStats.totalWorkMinutes).toBe(25);

        // Insert additional session
        await db.insert(sessionsTable)
            .values([{ type: 'work', duration: 30 }])
            .execute();

        const updatedStats = await getSessionStats();
        expect(updatedStats.totalSessions).toBe(3);
        expect(updatedStats.workSessions).toBe(2);
        expect(updatedStats.totalWorkMinutes).toBe(55);
        expect(updatedStats.breakSessions).toBe(1);
        expect(updatedStats.totalBreakMinutes).toBe(5);
    });
});
