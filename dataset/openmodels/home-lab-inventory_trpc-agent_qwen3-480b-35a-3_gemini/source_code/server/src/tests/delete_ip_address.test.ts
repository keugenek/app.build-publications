import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { deleteIPAddress } from '../handlers/delete_ip_address';
import { eq } from 'drizzle-orm';

describe('deleteIPAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing IP address', async () => {
    // First create an IP address to delete directly in the database
    const createdResult = await db.insert(ipAddressesTable)
      .values({
        address: '192.168.1.1',
        assignedTo: 'Server Room A'
      })
      .returning()
      .execute();
    
    const createdIPAddress = createdResult[0];
    
    // Verify the IP address was created
    expect(createdIPAddress.id).toBeDefined();
    expect(createdIPAddress.address).toBe('192.168.1.1');

    // Delete the IP address
    const result = await deleteIPAddress(createdIPAddress.id);

    // Verify the deletion was successful
    expect(result).toBe(true);

    // Verify the IP address no longer exists in the database
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, createdIPAddress.id))
      .execute();

    expect(ipAddresses).toHaveLength(0);
  });

  it('should return false when trying to delete a non-existent IP address', async () => {
    // Try to delete an IP address that doesn't exist
    const result = await deleteIPAddress(99999);

    // Verify the deletion was not successful
    expect(result).toBe(false);
  });

  it('should properly handle concurrent deletions', async () => {
    // Create an IP address
    const createdResult = await db.insert(ipAddressesTable)
      .values({
        address: '10.0.0.1',
        assignedTo: 'Workstation B'
      })
      .returning()
      .execute();
    
    const createdIPAddress = createdResult[0];

    // Delete the same IP address twice
    const firstResult = await deleteIPAddress(createdIPAddress.id);
    const secondResult = await deleteIPAddress(createdIPAddress.id);

    // First deletion should succeed, second should fail
    expect(firstResult).toBe(true);
    expect(secondResult).toBe(false);

    // Verify the IP address no longer exists
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, createdIPAddress.id))
      .execute();

    expect(ipAddresses).toHaveLength(0);
  });
});
