import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { srsEntriesTable, kanjiTable } from '../db/schema';
import { type UpdateSrsEntryInput } from '../schema';
import { updateSrsEntry } from '../handlers/update_srs_entry';
import { eq } from 'drizzle-orm';

describe('updateSrsEntry', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a test kanji first (required for foreign key constraint)
    await db.insert(kanjiTable).values({
      kanji: '一',
      meaning: 'one',
      jlpt_level: 'N5'
    }).execute();
  });
  
  afterEach(resetDB);

  it('should update an SRS entry with all fields provided', async () => {
    // First create an SRS entry to update
    const newSrsEntry = await db.insert(srsEntriesTable).values({
      user_id: 1,
      kanji_id: 1,
      familiarity_level: 2,
      next_review_date: '2023-12-01',
      last_reviewed_at: new Date('2023-11-25')
    }).returning().execute();
    
    const srsEntryId = newSrsEntry[0].id;
    
    // Update the SRS entry
    const updateInput: UpdateSrsEntryInput = {
      id: srsEntryId,
      familiarity_level: 4,
      next_review_date: new Date('2023-12-15'),
      last_reviewed_at: new Date('2023-12-01')
    };
    
    const result = await updateSrsEntry(updateInput);
    
    // Verify the result
    expect(result.id).toBe(srsEntryId);
    expect(result.user_id).toBe(1);
    expect(result.kanji_id).toBe(1);
    expect(result.familiarity_level).toBe(4);
    expect(result.next_review_date).toEqual(new Date('2023-12-15'));
    expect(result.last_reviewed_at).toEqual(new Date('2023-12-01'));
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields of an SRS entry', async () => {
    // First create an SRS entry to update
    const originalDate = '2023-12-01';
    const newDate = '2023-12-15';
    
    const newSrsEntry = await db.insert(srsEntriesTable).values({
      user_id: 1,
      kanji_id: 1,
      familiarity_level: 2,
      next_review_date: originalDate,
      last_reviewed_at: new Date('2023-11-25')
    }).returning().execute();
    
    const srsEntryId = newSrsEntry[0].id;
    const originalEntry = newSrsEntry[0];
    
    // Update only the familiarity level
    const updateInput: UpdateSrsEntryInput = {
      id: srsEntryId,
      familiarity_level: 5
    };
    
    const result = await updateSrsEntry(updateInput);
    
    // Verify that only the familiarity level changed
    expect(result.id).toBe(srsEntryId);
    expect(result.user_id).toBe(originalEntry.user_id);
    expect(result.kanji_id).toBe(originalEntry.kanji_id);
    expect(result.familiarity_level).toBe(5); // Updated
    expect(result.next_review_date).toEqual(new Date(originalDate)); // Unchanged
    expect(result.last_reviewed_at).toEqual(new Date('2023-11-25')); // Unchanged
    expect(result.created_at).toEqual(originalEntry.created_at); // Unchanged
  });

  it('should save updated SRS entry to database', async () => {
    // First create an SRS entry to update
    const newSrsEntry = await db.insert(srsEntriesTable).values({
      user_id: 2,
      kanji_id: 1,
      familiarity_level: 1,
      next_review_date: '2023-12-01'
    }).returning().execute();
    
    const srsEntryId = newSrsEntry[0].id;
    
    // Update the SRS entry
    const updateInput: UpdateSrsEntryInput = {
      id: srsEntryId,
      familiarity_level: 3,
      next_review_date: new Date('2023-12-10')
    };
    
    await updateSrsEntry(updateInput);
    
    // Query the database to verify the update was saved
    const entries = await db.select()
      .from(srsEntriesTable)
      .where(eq(srsEntriesTable.id, srsEntryId))
      .execute();
    
    expect(entries).toHaveLength(1);
    expect(entries[0].user_id).toBe(2);
    expect(entries[0].familiarity_level).toBe(3);
    expect(new Date(entries[0].next_review_date)).toEqual(new Date('2023-12-10'));
  });

  it('should throw an error when trying to update a non-existent SRS entry', async () => {
    const updateInput: UpdateSrsEntryInput = {
      id: 99999, // Non-existent ID
      familiarity_level: 3
    };
    
    await expect(updateSrsEntry(updateInput))
      .rejects
      .toThrow(/not found/);
  });
});
