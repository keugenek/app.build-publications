import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, tagsTable } from '../db/schema';
import { type UpdateTagInput } from '../schema';
import { updateTag } from '../handlers/update_tag';
import { eq } from 'drizzle-orm';

describe('updateTag', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testTagId: number;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();
    
    testUserId = userResult[0].id;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({
        user_id: testUserId,
        name: 'Original Tag',
        color: '#FF0000'
      })
      .returning()
      .execute();
    
    testTagId = tagResult[0].id;
  });

  it('should update tag name only', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      name: 'Updated Tag Name'
    };

    const result = await updateTag(input);

    expect(result.id).toEqual(testTagId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Updated Tag Name');
    expect(result.color).toEqual('#FF0000'); // Original color preserved
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update tag color only', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      color: '#00FF00'
    };

    const result = await updateTag(input);

    expect(result.id).toEqual(testTagId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Original Tag'); // Original name preserved
    expect(result.color).toEqual('#00FF00');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update both name and color', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      name: 'Updated Tag',
      color: '#0000FF'
    };

    const result = await updateTag(input);

    expect(result.id).toEqual(testTagId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Updated Tag');
    expect(result.color).toEqual('#0000FF');
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should set color to null', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      color: null
    };

    const result = await updateTag(input);

    expect(result.id).toEqual(testTagId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.name).toEqual('Original Tag'); // Original name preserved
    expect(result.color).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      name: 'Database Updated Tag',
      color: '#FFFFFF'
    };

    await updateTag(input);

    // Verify in database
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, testTagId))
      .execute();

    expect(tags).toHaveLength(1);
    expect(tags[0].name).toEqual('Database Updated Tag');
    expect(tags[0].color).toEqual('#FFFFFF');
    expect(tags[0].user_id).toEqual(testUserId);
  });

  it('should throw error for non-existent tag', async () => {
    const input: UpdateTagInput = {
      id: 99999,
      name: 'Non-existent Tag'
    };

    expect(updateTag(input)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Update only name first
    await updateTag({
      id: testTagId,
      name: 'First Update'
    });

    // Then update only color
    const result = await updateTag({
      id: testTagId,
      color: '#FFFF00'
    });

    expect(result.name).toEqual('First Update'); // Name preserved from first update
    expect(result.color).toEqual('#FFFF00'); // Color from second update
  });

  it('should preserve all other fields during update', async () => {
    const input: UpdateTagInput = {
      id: testTagId,
      name: 'Preserved Fields Test'
    };

    const result = await updateTag(input);

    // Verify all original fields are preserved
    expect(result.id).toEqual(testTagId);
    expect(result.user_id).toEqual(testUserId);
    expect(result.created_at).toBeInstanceOf(Date);
    
    // Verify only the specified field was updated
    expect(result.name).toEqual('Preserved Fields Test');
    expect(result.color).toEqual('#FF0000'); // Original color
  });
});
