import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { getIPAddress } from '../handlers/get_ip_address';
import { eq } from 'drizzle-orm';

describe('getIPAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch an existing IP address by ID', async () => {
    // First create a test IP address
    const testIPAddress = {
      address: '192.168.1.100',
      assignedTo: 'Server Room A'
    };

    const createdResult = await db.insert(ipAddressesTable)
      .values(testIPAddress)
      .returning()
      .execute();

    const createdIPAddress = createdResult[0];

    // Now test fetching it
    const result = await getIPAddress(createdIPAddress.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIPAddress.id);
    expect(result!.address).toEqual(testIPAddress.address);
    expect(result!.assignedTo).toEqual(testIPAddress.assignedTo);
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent IP address ID', async () => {
    const result = await getIPAddress(99999);
    expect(result).toBeNull();
  });

  it('should handle fetching IP address with special characters in address', async () => {
    // Create a test IP address with special characters
    const testIPAddress = {
      address: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
      assignedTo: 'IPv6 Network'
    };

    const createdResult = await db.insert(ipAddressesTable)
      .values(testIPAddress)
      .returning()
      .execute();

    const createdIPAddress = createdResult[0];

    // Now test fetching it
    const result = await getIPAddress(createdIPAddress.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIPAddress.id);
    expect(result!.address).toEqual(testIPAddress.address);
    expect(result!.assignedTo).toEqual(testIPAddress.assignedTo);
  });
});
