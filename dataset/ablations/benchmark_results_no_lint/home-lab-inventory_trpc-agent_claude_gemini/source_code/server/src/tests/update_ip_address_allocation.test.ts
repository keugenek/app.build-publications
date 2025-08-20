import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressAllocationsTable } from '../db/schema';
import { type UpdateIpAddressAllocationInput } from '../schema';
import { updateIpAddressAllocation } from '../handlers/update_ip_address_allocation';
import { eq } from 'drizzle-orm';

describe('updateIpAddressAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test IP address allocation
  const createTestAllocation = async () => {
    const result = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Test Server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'Reserved'
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should update all fields of an IP address allocation', async () => {
    const testAllocation = await createTestAllocation();

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id,
      ip_address: '10.0.0.50',
      purpose: 'Web Server',
      assigned_hardware_id: 1,
      assigned_software_id: 2,
      status: 'Allocated'
    };

    const result = await updateIpAddressAllocation(updateInput);

    expect(result.id).toEqual(testAllocation.id);
    expect(result.ip_address).toEqual('10.0.0.50');
    expect(result.purpose).toEqual('Web Server');
    expect(result.assigned_hardware_id).toEqual(1);
    expect(result.assigned_software_id).toEqual(2);
    expect(result.status).toEqual('Allocated');
    expect(result.created_at).toEqual(testAllocation.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testAllocation.updated_at.getTime());
  });

  it('should update only specified fields', async () => {
    const testAllocation = await createTestAllocation();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 2));

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id,
      ip_address: '172.16.0.10',
      status: 'Allocated'
    };

    const result = await updateIpAddressAllocation(updateInput);

    expect(result.id).toEqual(testAllocation.id);
    expect(result.ip_address).toEqual('172.16.0.10');
    expect(result.purpose).toEqual('Test Server'); // Should remain unchanged
    expect(result.assigned_hardware_id).toBeNull(); // Should remain unchanged
    expect(result.assigned_software_id).toBeNull(); // Should remain unchanged
    expect(result.status).toEqual('Allocated');
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(testAllocation.updated_at.getTime());
  });

  it('should update nullable fields to null', async () => {
    const testAllocation = await createTestAllocation();

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id,
      purpose: null,
      assigned_hardware_id: null,
      assigned_software_id: null
    };

    const result = await updateIpAddressAllocation(updateInput);

    expect(result.purpose).toBeNull();
    expect(result.assigned_hardware_id).toBeNull();
    expect(result.assigned_software_id).toBeNull();
    expect(result.ip_address).toEqual('192.168.1.100'); // Should remain unchanged
    expect(result.status).toEqual('Reserved'); // Should remain unchanged
  });

  it('should save updated allocation to database', async () => {
    const testAllocation = await createTestAllocation();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 2));

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id,
      ip_address: '203.0.113.5',
      purpose: 'Database Server',
      status: 'In Use'
    };

    await updateIpAddressAllocation(updateInput);

    // Verify the changes were persisted
    const allocations = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, testAllocation.id))
      .execute();

    expect(allocations).toHaveLength(1);
    const allocation = allocations[0];
    expect(allocation.ip_address).toEqual('203.0.113.5');
    expect(allocation.purpose).toEqual('Database Server');
    expect(allocation.status).toEqual('In Use');
    expect(allocation.updated_at).toBeInstanceOf(Date);
    expect(allocation.updated_at.getTime()).toBeGreaterThan(testAllocation.updated_at.getTime());
  });

  it('should handle updating with foreign key assignments', async () => {
    const testAllocation = await createTestAllocation();

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id,
      assigned_hardware_id: 5,
      assigned_software_id: 3,
      purpose: 'Production VM'
    };

    const result = await updateIpAddressAllocation(updateInput);

    expect(result.assigned_hardware_id).toEqual(5);
    expect(result.assigned_software_id).toEqual(3);
    expect(result.purpose).toEqual('Production VM');
    expect(result.ip_address).toEqual('192.168.1.100'); // Should remain unchanged
  });

  it('should throw error when allocation does not exist', async () => {
    const updateInput: UpdateIpAddressAllocationInput = {
      id: 999,
      ip_address: '192.168.1.200'
    };

    expect(updateIpAddressAllocation(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle minimal update with only timestamp change', async () => {
    const testAllocation = await createTestAllocation();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 1));

    const updateInput: UpdateIpAddressAllocationInput = {
      id: testAllocation.id
    };

    const result = await updateIpAddressAllocation(updateInput);

    // All original data should remain the same except updated_at
    expect(result.ip_address).toEqual(testAllocation.ip_address);
    expect(result.purpose).toEqual(testAllocation.purpose);
    expect(result.assigned_hardware_id).toEqual(testAllocation.assigned_hardware_id);
    expect(result.assigned_software_id).toEqual(testAllocation.assigned_software_id);
    expect(result.status).toEqual(testAllocation.status);
    expect(result.created_at).toEqual(testAllocation.created_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(testAllocation.updated_at.getTime());
  });

  it('should handle updating status values', async () => {
    const testAllocation = await createTestAllocation();

    const statusValues = ['Reserved', 'Allocated', 'In Use', 'Available', 'Deprecated'];

    for (const status of statusValues) {
      const updateInput: UpdateIpAddressAllocationInput = {
        id: testAllocation.id,
        status: status
      };

      const result = await updateIpAddressAllocation(updateInput);
      expect(result.status).toEqual(status);
    }
  });
});
