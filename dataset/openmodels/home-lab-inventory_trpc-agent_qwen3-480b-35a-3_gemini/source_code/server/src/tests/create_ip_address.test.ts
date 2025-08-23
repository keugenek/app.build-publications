import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable } from '../db/schema';
import { type CreateIPAddressInput } from '../schema';
import { createIPAddress } from '../handlers/create_ip_address';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateIPAddressInput = {
  address: '192.168.1.100',
  assignedTo: 'Server Room A'
};

describe('createIPAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP address', async () => {
    const result = await createIPAddress(testInput);

    // Basic field validation
    expect(result.address).toEqual('192.168.1.100');
    expect(result.assignedTo).toEqual('Server Room A');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save IP address to database', async () => {
    const result = await createIPAddress(testInput);

    // Query using proper drizzle syntax
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, result.id))
      .execute();

    expect(ipAddresses).toHaveLength(1);
    expect(ipAddresses[0].address).toEqual('192.168.1.100');
    expect(ipAddresses[0].assignedTo).toEqual('Server Room A');
    expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
  });
});
