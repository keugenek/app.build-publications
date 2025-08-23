import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { getSuggestions } from '../handlers/get_suggestions';
// import { gte } from 'drizzle-orm';

/** Helper to insert a daily metrics record */
async function insertMetrics(overrides: Partial<
  typeof dailyMetricsTable.$inferInsert
> = {}) {
  const base = {
    date: new Date().toISOString().split('T')[0],
    sleep_duration: '7', // numeric columns stored as strings
    work_hours: '9',
    social_time: '2',
    screen_time: '5',
    emotional_energy: 7,
    ...overrides,
  };
  await db
    .insert(dailyMetricsTable)
    .values(base)
    .execute();
}

describe('getSuggestions handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('suggests break for work hours when threshold is exceeded', async () => {
    await insertMetrics();
    const suggestions = await getSuggestions({ workHoursThreshold: 8 });
    expect(suggestions).toContain('Consider taking a break after 8 hours of work.');
    // No screen suggestion expected
    expect(suggestions).not.toContain('screen time');
  });

  it('suggests break for screen time when threshold is exceeded', async () => {
    await insertMetrics();
    const suggestions = await getSuggestions({ screenTimeThreshold: 4 });
    expect(suggestions).toContain('Consider taking a break after 4 hours of screen time.');
    expect(suggestions).not.toContain('work');
  });

  it('returns both suggestions when both thresholds are exceeded', async () => {
    await insertMetrics();
    const suggestions = await getSuggestions({ workHoursThreshold: 8, screenTimeThreshold: 4 });
    expect(suggestions).toContain('Consider taking a break after 8 hours of work.');
    expect(suggestions).toContain('Consider taking a break after 4 hours of screen time.');
  });

  it('returns default suggestion when thresholds are not exceeded', async () => {
    // Insert a low-work, low-screen record
    await insertMetrics({ work_hours: '5', screen_time: '2' });
    const suggestions = await getSuggestions({ workHoursThreshold: 8, screenTimeThreshold: 4 });
    expect(suggestions).toEqual(['All metrics look good. Keep up the good work!']);
  });
});
