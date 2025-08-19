import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type IdParam, type CreateIpAllocationInput } from '../schema';
import { deleteIpAllocation } from '../handlers/delete_ip_allocation';
import { eq } from 'drizzle-orm';

// Test input for creating IP allocation
const testIpAllocationInput: CreateIpAllocationInput = {
  ip_address: '192.168.1.100',
  asset_name: 'Test Server',
  hardware_asset_id: null,
  software_asset_id: null,
  description: 'Test IP allocation for deletion'
};

describe('deleteIpAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an IP allocation successfully', async () => {
    // Create an IP allocation first
    const insertResult = await db.insert(ipAllocationsTable)
      .values(testIpAllocationInput)
      .returning()
      .execute();

    const createdAllocation = insertResult[0];
    expect(createdAllocation.id).toBeDefined();

    // Delete the IP allocation
    const deleteParams: IdParam = { id: createdAllocation.id };
    const result = await deleteIpAllocation(deleteParams);

    expect(result.success).toBe(true);

    // Verify the IP allocation was actually deleted from the database
    const remainingAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, createdAllocation.id))
      .execute();

    expect(remainingAllocations).toHaveLength(0);
  });

  it('should handle deletion of non-existent IP allocation', async () => {
    const deleteParams: IdParam = { id: 999999 };
    const result = await deleteIpAllocation(deleteParams);

    // Should still return success even if no rows were affected
    expect(result.success).toBe(true);
  });

  it('should delete IP allocation with hardware asset reference', async () => {
    // Create a hardware asset first
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Hardware',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge',
        location: 'Rack 1'
      })
      .returning()
      .execute();

    // Create IP allocation linked to hardware asset
    const ipAllocationWithHardware = await db.insert(ipAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.101',
        hardware_asset_id: hardwareAsset[0].id
      })
      .returning()
      .execute();

    // Delete the IP allocation
    const deleteParams: IdParam = { id: ipAllocationWithHardware[0].id };
    const result = await deleteIpAllocation(deleteParams);

    expect(result.success).toBe(true);

    // Verify the IP allocation was deleted
    const remainingAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, ipAllocationWithHardware[0].id))
      .execute();

    expect(remainingAllocations).toHaveLength(0);

    // Verify the hardware asset still exists (foreign key relationship should not cascade)
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hardwareAsset[0].id))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
  });

  it('should delete IP allocation with software asset reference', async () => {
    // Create a hardware asset first (required for software asset)
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant',
        location: 'Rack 2'
      })
      .returning()
      .execute();

    // Create a software asset
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'vm',
        host_id: hardwareAsset[0].id,
        description: 'Test virtual machine'
      })
      .returning()
      .execute();

    // Create IP allocation linked to software asset
    const ipAllocationWithSoftware = await db.insert(ipAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.102',
        software_asset_id: softwareAsset[0].id
      })
      .returning()
      .execute();

    // Delete the IP allocation
    const deleteParams: IdParam = { id: ipAllocationWithSoftware[0].id };
    const result = await deleteIpAllocation(deleteParams);

    expect(result.success).toBe(true);

    // Verify the IP allocation was deleted
    const remainingAllocations = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, ipAllocationWithSoftware[0].id))
      .execute();

    expect(remainingAllocations).toHaveLength(0);

    // Verify the software asset still exists
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset[0].id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
  });

  it('should delete multiple IP allocations independently', async () => {
    // Create multiple IP allocations
    const allocation1 = await db.insert(ipAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.103'
      })
      .returning()
      .execute();

    const allocation2 = await db.insert(ipAllocationsTable)
      .values({
        ...testIpAllocationInput,
        ip_address: '192.168.1.104'
      })
      .returning()
      .execute();

    // Delete only the first allocation
    const deleteParams: IdParam = { id: allocation1[0].id };
    const result = await deleteIpAllocation(deleteParams);

    expect(result.success).toBe(true);

    // Verify only the first allocation was deleted
    const firstAllocation = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, allocation1[0].id))
      .execute();

    const secondAllocation = await db.select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, allocation2[0].id))
      .execute();

    expect(firstAllocation).toHaveLength(0);
    expect(secondAllocation).toHaveLength(1);
  });
});
