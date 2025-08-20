import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { dailyMetricsTable } from '../db/schema';
import { deleteDailyMetrics } from '../handlers/delete_daily_metrics';
import { eq } from 'drizzle-orm';

describe('deleteDailyMetrics', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test record directly
    await db.insert(dailyMetricsTable).values({
      date: '2023-01-15', // Date as string
      sleep_duration: '7.5', // Stored as string in DB
      work_hours: '8.0', // Stored as string in DB
      social_time: '2.0', // Stored as string in DB
      screen_time: '4.5', // Stored as string in DB
      emotional_energy: 7
    }).execute();
  });
  
  afterEach(resetDB);

  it('should delete a daily metrics entry', async () => {
    // Get the created record
    const records = await db.select()
      .from(dailyMetricsTable)
      .execute();
    
    expect(records).toHaveLength(1);
    const idToDelete = records[0].id;
    
    // Delete the entry
    const result = await deleteDailyMetrics(idToDelete);
    
    // Should return true on successful deletion
    expect(result).toBe(true);
    
    // Verify the entry no longer exists in the database
    const metrics = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, idToDelete))
      .execute();
    
    expect(metrics).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent entry', async () => {
    // Try to delete an entry that doesn't exist
    const result = await deleteDailyMetrics(99999);
    
    // Should return false since no record was deleted
    expect(result).toBe(false);
  });

  it('should only delete the specified entry', async () => {
    // Create another entry
    await db.insert(dailyMetricsTable).values({
      date: '2023-01-16', // Date as string
      sleep_duration: '8.0', // Stored as string in DB
      work_hours: '7.5', // Stored as string in DB
      social_time: '3.0', // Stored as string in DB
      screen_time: '5.0', // Stored as string in DB
      emotional_energy: 8
    }).execute();
    
    // Get all records
    const records = await db.select()
      .from(dailyMetricsTable)
      .orderBy(dailyMetricsTable.id)
      .execute();
    
    expect(records).toHaveLength(2);
    
    // Delete only the first entry
    const result = await deleteDailyMetrics(records[0].id);
    expect(result).toBe(true);
    
    // Verify first entry is deleted
    const metrics1 = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, records[0].id))
      .execute();
    expect(metrics1).toHaveLength(0);
    
    // Verify second entry still exists
    const metrics2 = await db.select()
      .from(dailyMetricsTable)
      .where(eq(dailyMetricsTable.id, records[1].id))
      .execute();
    expect(metrics2).toHaveLength(1);
    expect(metrics2[0].id).toBe(records[1].id);
  });
});
