import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { activitiesTable } from '../db/schema';
import { logActivity } from '../handlers/log_activity';
import { type LogActivityInput } from '../schema';
import { eq } from 'drizzle-orm';

// Helper to fetch activity directly from DB
const fetchActivity = async (id: number) => {
  const rows = await db.select().from(activitiesTable).where(eq(activitiesTable.id, id)).execute();
  return rows[0];
};

describe('logActivity handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should insert activity and return correct fields', async () => {
    const input: LogActivityInput = { type: 'PROLONGED_STARING' };
    const result = await logActivity(input);

    // Validate returned object
    expect(result.id).toBeGreaterThan(0);
    expect(result.type).toBe('PROLONGED_STARING');
    expect(result.points).toBe(5);
    expect(result.created_at).toBeInstanceOf(Date);

    // Verify persisted in DB
    const dbRow = await fetchActivity(result.id);
    expect(dbRow).toBeDefined();
    expect(dbRow.type).toBe('PROLONGED_STARING');
    expect(dbRow.points).toBe(5);
    // created_at should be a Date
    expect(dbRow.created_at).toBeInstanceOf(Date);
  });

  it('should correctly map points for different activity types', async () => {
    const cases: Array<[LogActivityInput, number]> = [
      [{ type: 'DEAD_INSECT_GIFT' }, 10],
      [{ type: 'LIVE_ANIMAL_GIFT' }, 20],
      [{ type: 'MIDNIGHT_ZOOMIES' }, 8],
      [{ type: 'IGNORING_COMMANDS' }, 4],
      [{ type: 'INTENSE_GROOMING_GLANCE' }, 7],
    ];

    for (const [input, expectedPoints] of cases) {
      const result = await logActivity(input as LogActivityInput);
      expect(result.points).toBe(expectedPoints);
      const dbRow = await fetchActivity(result.id);
      expect(dbRow.points).toBe(expectedPoints);
    }
  });
});
