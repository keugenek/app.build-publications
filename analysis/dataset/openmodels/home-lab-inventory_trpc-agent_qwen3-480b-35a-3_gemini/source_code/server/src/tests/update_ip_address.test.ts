import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type CreateIPAddressInput, type UpdateIPAddressInput } from '../schema';
import { updateIPAddress } from '../handlers/update_ip_address';
import { eq } from 'drizzle-orm';

// Test data
const testCreateInput: CreateIPAddressInput = {
  address: '192.168.1.100',
  assignedTo: 'Server Room A'
};

const createTestIPAddress = async () => {
  const result = await db.insert(ipAddressesTable)
    .values(testCreateInput)
    .returning()
    .execute();
  return result[0];
};

describe('updateIPAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update an IP address', async () => {
    // Create a test IP address
    const created = await createTestIPAddress();
    
    // Update the IP address
    const updateInput: UpdateIPAddressInput = {
      id: created.id,
      address: '10.0.0.50',
      assignedTo: 'Data Center B'
    };
    
    const result = await updateIPAddress(updateInput);
    
    // Check that the update was successful
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.address).toEqual('10.0.0.50');
    expect(result!.assignedTo).toEqual('Data Center B');
    expect(result!.created_at).toBeInstanceOf(Date);
  });

  it('should partially update an IP address', async () => {
    // Create a test IP address
    const created = await createTestIPAddress();
    
    // Update only the address
    const updateInput: UpdateIPAddressInput = {
      id: created.id,
      address: '172.16.0.25'
    };
    
    const result = await updateIPAddress(updateInput);
    
    // Check that only the address was updated
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(created.id);
    expect(result!.address).toEqual('172.16.0.25');
    expect(result!.assignedTo).toEqual(testCreateInput.assignedTo); // Should remain unchanged
  });

  it('should return null when updating non-existent IP address', async () => {
    const updateInput: UpdateIPAddressInput = {
      id: 99999,
      address: '10.0.0.1'
    };
    
    const result = await updateIPAddress(updateInput);
    
    expect(result).toBeNull();
  });

  it('should save updated IP address to database', async () => {
    // Create a test IP address
    const created = await createTestIPAddress();
    
    // Update the IP address
    const updateInput: UpdateIPAddressInput = {
      id: created.id,
      assignedTo: 'New Location'
    };
    
    await updateIPAddress(updateInput);
    
    // Query the database to verify the update was saved
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, created.id))
      .execute();
    
    expect(ipAddresses).toHaveLength(1);
    expect(ipAddresses[0].id).toEqual(created.id);
    expect(ipAddresses[0].address).toEqual(testCreateInput.address); // Should remain unchanged
    expect(ipAddresses[0].assignedTo).toEqual('New Location'); // Should be updated
    expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
  });

  it('should return null when no fields are provided to update', async () => {
    // Create a test IP address
    const created = await createTestIPAddress();
    
    // Try to update with no fields
    const updateInput: UpdateIPAddressInput = {
      id: created.id
    };
    
    const result = await updateIPAddress(updateInput);
    
    expect(result).toBeNull();
  });
});
