import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, collectionsTable, tagsTable, bookmarksTable, bookmarkTagsTable } from '../db/schema';
import { type DeleteEntityInput } from '../schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';


describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a user successfully', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;
    const input: DeleteEntityInput = { id: userId };

    // Delete user
    const result = await deleteUser(input);

    expect(result.success).toBe(true);

    // Verify user no longer exists
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent user', async () => {
    const input: DeleteEntityInput = { id: 999 };

    const result = await deleteUser(input);

    expect(result.success).toBe(false);
  });

  it('should cascade delete all user collections', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test collections
    await db.insert(collectionsTable)
      .values([
        { user_id: userId, name: 'Collection 1', description: 'First collection' },
        { user_id: userId, name: 'Collection 2', description: 'Second collection' }
      ])
      .execute();

    const input: DeleteEntityInput = { id: userId };

    // Delete user
    const result = await deleteUser(input);
    expect(result.success).toBe(true);

    // Verify collections are deleted
    const collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, userId))
      .execute();

    expect(collections).toHaveLength(0);
  });

  it('should cascade delete all user tags', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test tags
    await db.insert(tagsTable)
      .values([
        { user_id: userId, name: 'Tag 1', color: '#ff0000' },
        { user_id: userId, name: 'Tag 2', color: '#00ff00' }
      ])
      .execute();

    const input: DeleteEntityInput = { id: userId };

    // Delete user
    const result = await deleteUser(input);
    expect(result.success).toBe(true);

    // Verify tags are deleted
    const tags = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.user_id, userId))
      .execute();

    expect(tags).toHaveLength(0);
  });

  it('should cascade delete all user bookmarks and bookmark-tag relations', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        username: 'testuser',
        email: 'test@example.com',
        password_hash: 'hashed_password'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test collection
    const collectionResult = await db.insert(collectionsTable)
      .values({ user_id: userId, name: 'Test Collection' })
      .returning()
      .execute();

    const collectionId = collectionResult[0].id;

    // Create test tag
    const tagResult = await db.insert(tagsTable)
      .values({ user_id: userId, name: 'Test Tag', color: '#ff0000' })
      .returning()
      .execute();

    const tagId = tagResult[0].id;

    // Create test bookmarks
    const bookmarkResult = await db.insert(bookmarksTable)
      .values([
        {
          user_id: userId,
          collection_id: collectionId,
          title: 'Test Bookmark 1',
          url: 'https://example.com',
          description: 'First bookmark'
        },
        {
          user_id: userId,
          collection_id: null,
          title: 'Test Bookmark 2',
          url: 'https://example2.com',
          description: 'Second bookmark'
        }
      ])
      .returning()
      .execute();

    const bookmarkIds = bookmarkResult.map(b => b.id);

    // Create bookmark-tag relations
    await db.insert(bookmarkTagsTable)
      .values([
        { bookmark_id: bookmarkIds[0], tag_id: tagId },
        { bookmark_id: bookmarkIds[1], tag_id: tagId }
      ])
      .execute();

    const input: DeleteEntityInput = { id: userId };

    // Delete user
    const result = await deleteUser(input);
    expect(result.success).toBe(true);

    // Verify bookmarks are deleted
    const bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, userId))
      .execute();

    expect(bookmarks).toHaveLength(0);

    // Verify bookmark-tag relations are deleted
    const bookmarkTags = await db.select()
      .from(bookmarkTagsTable)
      .execute();

    expect(bookmarkTags).toHaveLength(0);
  });

  it('should not affect other users data when deleting one user', async () => {
    // Create test users
    const userResults = await db.insert(usersTable)
      .values([
        { username: 'user1', email: 'user1@example.com', password_hash: 'hashed_password' },
        { username: 'user2', email: 'user2@example.com', password_hash: 'hashed_password' }
      ])
      .returning()
      .execute();

    const user1Id = userResults[0].id;
    const user2Id = userResults[1].id;

    // Create collections for both users
    await db.insert(collectionsTable)
      .values([
        { user_id: user1Id, name: 'User 1 Collection' },
        { user_id: user2Id, name: 'User 2 Collection' }
      ])
      .execute();

    // Create bookmarks for both users
    await db.insert(bookmarksTable)
      .values([
        { user_id: user1Id, title: 'User 1 Bookmark', url: 'https://user1.com' },
        { user_id: user2Id, title: 'User 2 Bookmark', url: 'https://user2.com' }
      ])
      .execute();

    const input: DeleteEntityInput = { id: user1Id };

    // Delete user 1
    const result = await deleteUser(input);
    expect(result.success).toBe(true);

    // Verify user 1 is deleted
    const user1 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user1Id))
      .execute();

    expect(user1).toHaveLength(0);

    // Verify user 2 still exists with their data
    const user2 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, user2Id))
      .execute();

    expect(user2).toHaveLength(1);
    expect(user2[0].username).toBe('user2');

    // Verify user 2's collections still exist
    const user2Collections = await db.select()
      .from(collectionsTable)
      .where(eq(collectionsTable.user_id, user2Id))
      .execute();

    expect(user2Collections).toHaveLength(1);
    expect(user2Collections[0].name).toBe('User 2 Collection');

    // Verify user 2's bookmarks still exist
    const user2Bookmarks = await db.select()
      .from(bookmarksTable)
      .where(eq(bookmarksTable.user_id, user2Id))
      .execute();

    expect(user2Bookmarks).toHaveLength(1);
    expect(user2Bookmarks[0].title).toBe('User 2 Bookmark');
  });
});
