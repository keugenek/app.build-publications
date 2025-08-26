import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { userProfilesTable, connectionsTable } from '../db/schema';
import { type UpdateConnectionStatusInput } from '../schema';
import { updateConnectionStatus } from '../handlers/update_connection_status';
import { eq } from 'drizzle-orm';

// Test user profiles for creating connections
const testRequester = {
  name: 'John Doe',
  skill_level: 'Intermediate' as const,
  city: 'New York',
  state: 'NY',
  bio: 'Looking for tennis partners'
};

const testTarget = {
  name: 'Jane Smith',
  skill_level: 'Beginner' as const,
  city: 'Los Angeles',
  state: 'CA',
  bio: 'New to tennis, want to learn'
};

describe('updateConnectionStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should accept a pending connection request', async () => {
    // Create users
    const [requester] = await db.insert(userProfilesTable)
      .values(testRequester)
      .returning()
      .execute();

    const [target] = await db.insert(userProfilesTable)
      .values(testTarget)
      .returning()
      .execute();

    // Create pending connection
    const [connection] = await db.insert(connectionsTable)
      .values({
        requester_id: requester.id,
        target_id: target.id,
        status: 'pending'
      })
      .returning()
      .execute();

    // Update to accepted status
    const updateInput: UpdateConnectionStatusInput = {
      connection_id: connection.id,
      status: 'accepted'
    };

    const result = await updateConnectionStatus(updateInput);

    // Verify result
    expect(result.id).toEqual(connection.id);
    expect(result.status).toEqual('accepted');
    expect(result.requester_id).toEqual(requester.id);
    expect(result.target_id).toEqual(target.id);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should decline a pending connection request', async () => {
    // Create users
    const [requester] = await db.insert(userProfilesTable)
      .values(testRequester)
      .returning()
      .execute();

    const [target] = await db.insert(userProfilesTable)
      .values(testTarget)
      .returning()
      .execute();

    // Create pending connection
    const [connection] = await db.insert(connectionsTable)
      .values({
        requester_id: requester.id,
        target_id: target.id,
        status: 'pending'
      })
      .returning()
      .execute();

    // Update to declined status
    const updateInput: UpdateConnectionStatusInput = {
      connection_id: connection.id,
      status: 'declined'
    };

    const result = await updateConnectionStatus(updateInput);

    // Verify result
    expect(result.id).toEqual(connection.id);
    expect(result.status).toEqual('declined');
    expect(result.requester_id).toEqual(requester.id);
    expect(result.target_id).toEqual(target.id);
  });

  it('should update status in database', async () => {
    // Create users
    const [requester] = await db.insert(userProfilesTable)
      .values(testRequester)
      .returning()
      .execute();

    const [target] = await db.insert(userProfilesTable)
      .values(testTarget)
      .returning()
      .execute();

    // Create pending connection
    const [connection] = await db.insert(connectionsTable)
      .values({
        requester_id: requester.id,
        target_id: target.id,
        status: 'pending'
      })
      .returning()
      .execute();

    // Update to accepted status
    await updateConnectionStatus({
      connection_id: connection.id,
      status: 'accepted'
    });

    // Verify database was updated
    const updatedConnections = await db.select()
      .from(connectionsTable)
      .where(eq(connectionsTable.id, connection.id))
      .execute();

    expect(updatedConnections).toHaveLength(1);
    expect(updatedConnections[0].status).toEqual('accepted');
  });

  it('should throw error for non-existent connection', async () => {
    const updateInput: UpdateConnectionStatusInput = {
      connection_id: 99999,
      status: 'accepted'
    };

    await expect(updateConnectionStatus(updateInput))
      .rejects
      .toThrow(/Connection with id 99999 not found/i);
  });

  it('should handle changing status from accepted back to declined', async () => {
    // Create users
    const [requester] = await db.insert(userProfilesTable)
      .values(testRequester)
      .returning()
      .execute();

    const [target] = await db.insert(userProfilesTable)
      .values(testTarget)
      .returning()
      .execute();

    // Create accepted connection
    const [connection] = await db.insert(connectionsTable)
      .values({
        requester_id: requester.id,
        target_id: target.id,
        status: 'accepted'
      })
      .returning()
      .execute();

    // Change to declined
    const result = await updateConnectionStatus({
      connection_id: connection.id,
      status: 'declined'
    });

    // Verify status changed
    expect(result.status).toEqual('declined');

    // Verify in database
    const dbConnection = await db.select()
      .from(connectionsTable)
      .where(eq(connectionsTable.id, connection.id))
      .execute();

    expect(dbConnection[0].status).toEqual('declined');
  });
});
