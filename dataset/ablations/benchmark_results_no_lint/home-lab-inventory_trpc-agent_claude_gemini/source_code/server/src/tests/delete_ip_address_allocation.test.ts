import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type DeleteInput, type CreateIpAddressAllocationInput } from '../schema';
import { deleteIpAddressAllocation } from '../handlers/delete_ip_address_allocation';
import { eq } from 'drizzle-orm';

// Test input for creating IP address allocations
const testIpAllocationInput: CreateIpAddressAllocationInput = {
  ip_address: '192.168.1.100',
  purpose: 'Test server',
  assigned_hardware_id: null,
  assigned_software_id: null,
  status: 'active'
};

describe('deleteIpAddressAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing IP address allocation', async () => {
    // First create an IP address allocation
    const created = await db.insert(ipAddressAllocationsTable)
      .values(testIpAllocationInput)
      .returning()
      .execute();

    const ipAllocationId = created[0].id;

    // Delete the IP address allocation
    const deleteInput: DeleteInput = { id: ipAllocationId };
    const result = await deleteIpAddressAllocation(deleteInput);

    // Should return success
    expect(result.success).toBe(true);

    // Verify the record is actually deleted from database
    const remainingAllocations = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, ipAllocationId))
      .execute();

    expect(remainingAllocations).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent IP address allocation', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteInput = { id: nonExistentId };

    const result = await deleteIpAddressAllocation(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other IP address allocations when deleting one', async () => {
    // Create multiple IP address allocations
    const allocation1 = await db.insert(ipAddressAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.101',
        purpose: 'First allocation'
      })
      .returning()
      .execute();

    const allocation2 = await db.insert(ipAddressAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.102',
        purpose: 'Second allocation'
      })
      .returning()
      .execute();

    // Delete only the first allocation
    const deleteInput: DeleteInput = { id: allocation1[0].id };
    const result = await deleteIpAddressAllocation(deleteInput);

    expect(result.success).toBe(true);

    // Verify first allocation is deleted
    const deletedAllocation = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, allocation1[0].id))
      .execute();

    expect(deletedAllocation).toHaveLength(0);

    // Verify second allocation still exists
    const remainingAllocation = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, allocation2[0].id))
      .execute();

    expect(remainingAllocation).toHaveLength(1);
    expect(remainingAllocation[0].purpose).toBe('Second allocation');
  });

  it('should delete IP address allocation with foreign key references', async () => {
    // Create prerequisite data
    const hardware = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge',
        serial_number: 'SN12345',
        description: 'Test hardware'
      })
      .returning()
      .execute();

    const software = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'Virtual Machine',
        hardware_asset_id: hardware[0].id,
        operating_system: 'Ubuntu 20.04',
        purpose: 'Testing',
        resource_allocation: '4GB RAM, 2 vCPU',
        ip_address_id: null
      })
      .returning()
      .execute();

    // Create IP address allocation with foreign key references
    const ipAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ...testIpAllocationInput,
        assigned_hardware_id: hardware[0].id,
        assigned_software_id: software[0].id
      })
      .returning()
      .execute();

    // Delete the IP address allocation
    const deleteInput: DeleteInput = { id: ipAllocation[0].id };
    const result = await deleteIpAddressAllocation(deleteInput);

    expect(result.success).toBe(true);

    // Verify the IP allocation is deleted
    const deletedAllocation = await db.select()
      .from(ipAddressAllocationsTable)
      .where(eq(ipAddressAllocationsTable.id, ipAllocation[0].id))
      .execute();

    expect(deletedAllocation).toHaveLength(0);

    // Verify that referenced hardware and software still exist
    const hardwareExists = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardware[0].id))
      .execute();

    const softwareExists = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, software[0].id))
      .execute();

    expect(hardwareExists).toHaveLength(1);
    expect(softwareExists).toHaveLength(1);
  });
});
