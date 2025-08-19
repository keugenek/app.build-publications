import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { behaviorTypesTable } from '../db/schema';
import { type UpdateBehaviorTypeInput } from '../schema';
import { updateBehaviorType } from '../handlers/update_behavior_type';
import { eq } from 'drizzle-orm';

describe('updateBehaviorType', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a custom behavior type name', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Original Name',
        conspiracy_score: 5,
        is_custom: true
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id,
      name: 'Updated Name'
    };

    const result = await updateBehaviorType(input);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Name');
    expect(result.conspiracy_score).toEqual(5); // Should remain unchanged
    expect(result.is_custom).toEqual(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update a custom behavior type conspiracy score', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Test Behavior',
        conspiracy_score: 3,
        is_custom: true
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id,
      conspiracy_score: 8
    };

    const result = await updateBehaviorType(input);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Test Behavior'); // Should remain unchanged
    expect(result.conspiracy_score).toEqual(8);
    expect(result.is_custom).toEqual(true);
  });

  it('should update both name and conspiracy score', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Original Behavior',
        conspiracy_score: 4,
        is_custom: true
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id,
      name: 'Fully Updated Behavior',
      conspiracy_score: 9
    };

    const result = await updateBehaviorType(input);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Fully Updated Behavior');
    expect(result.conspiracy_score).toEqual(9);
    expect(result.is_custom).toEqual(true);
  });

  it('should persist changes in database', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Database Test',
        conspiracy_score: 6,
        is_custom: true
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id,
      name: 'Updated in Database',
      conspiracy_score: 7
    };

    await updateBehaviorType(input);

    // Query database to verify changes were persisted
    const updated = await db.select()
      .from(behaviorTypesTable)
      .where(eq(behaviorTypesTable.id, created.id))
      .execute();

    expect(updated).toHaveLength(1);
    expect(updated[0].name).toEqual('Updated in Database');
    expect(updated[0].conspiracy_score).toEqual(7);
    expect(updated[0].is_custom).toEqual(true);
  });

  it('should return unchanged record when no fields provided', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Unchanged Behavior',
        conspiracy_score: 2,
        is_custom: true
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id
      // No name or conspiracy_score provided
    };

    const result = await updateBehaviorType(input);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Unchanged Behavior');
    expect(result.conspiracy_score).toEqual(2);
    expect(result.is_custom).toEqual(true);
  });

  it('should throw error when behavior type not found', async () => {
    const input: UpdateBehaviorTypeInput = {
      id: 99999, // Non-existent ID
      name: 'Will Not Work'
    };

    await expect(updateBehaviorType(input)).rejects.toThrow(/not found/i);
  });

  it('should throw error when trying to update predefined behavior type', async () => {
    // Create a predefined behavior type
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Predefined Behavior',
        conspiracy_score: 5,
        is_custom: false // This is predefined
      })
      .returning()
      .execute();

    const input: UpdateBehaviorTypeInput = {
      id: created.id,
      name: 'Cannot Update This'
    };

    await expect(updateBehaviorType(input)).rejects.toThrow(/cannot update predefined/i);
  });

  it('should allow partial updates without affecting other fields', async () => {
    // Create a custom behavior type first
    const [created] = await db.insert(behaviorTypesTable)
      .values({
        name: 'Partial Update Test',
        conspiracy_score: 3,
        is_custom: true
      })
      .returning()
      .execute();

    // Update only the name
    const nameInput: UpdateBehaviorTypeInput = {
      id: created.id,
      name: 'Name Only Updated'
    };

    const nameResult = await updateBehaviorType(nameInput);
    expect(nameResult.name).toEqual('Name Only Updated');
    expect(nameResult.conspiracy_score).toEqual(3); // Should be unchanged

    // Update only the conspiracy score
    const scoreInput: UpdateBehaviorTypeInput = {
      id: created.id,
      conspiracy_score: 10
    };

    const scoreResult = await updateBehaviorType(scoreInput);
    expect(scoreResult.name).toEqual('Name Only Updated'); // Should remain from previous update
    expect(scoreResult.conspiracy_score).toEqual(10);
  });
});
