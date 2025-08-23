import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { usersTable, foldersTable } from '../db/schema';
import { getFolders } from '../handlers/get_folders';

describe('getFolders handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when there are no folders', async () => {
    const result = await getFolders();
    expect(result).toEqual([]);
  });

  it('should retrieve folders from the database', async () => {
    // Create a user first (folders have a foreign key to users)
    const [user] = await db
      .insert(usersTable)
      .values({
        email: 'testuser@example.com',
        password_hash: 'hashedpassword', // placeholder hash
      })
      .returning()
      .execute();

    // Insert a folder linked to the created user
    const folderData = {
      user_id: user.id,
      name: 'Work',
    };
    const [folder] = await db
      .insert(foldersTable)
      .values(folderData)
      .returning()
      .execute();

    // Call the handler
    const result = await getFolders();

    // Verify the inserted folder is returned correctly
    expect(result).toHaveLength(1);
    const fetched = result[0];
    expect(fetched.id).toBe(folder.id);
    expect(fetched.name).toBe('Work');
    expect(fetched.user_id).toBe(user.id);
    expect(fetched.created_at).toBeInstanceOf(Date);
  });
});
