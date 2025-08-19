import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type IdParam, type CreateIpAllocationInput } from '../schema';
import { getIpAllocation } from '../handlers/get_ip_allocation';
import { eq } from 'drizzle-orm';

describe('getIpAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get an IP allocation by ID', async () => {
    // Create a test IP allocation directly in database
    const ipAllocationData = {
      ip_address: '192.168.1.100',
      asset_name: 'Test Server',
      hardware_asset_id: null,
      software_asset_id: null,
      description: 'Test IP allocation'
    };

    const createdResult = await db.insert(ipAllocationsTable)
      .values(ipAllocationData)
      .returning()
      .execute();

    const createdAllocation = createdResult[0];

    // Test the handler
    const params: IdParam = { id: createdAllocation.id };
    const result = await getIpAllocation(params);

    // Verify the result
    expect(result).toBeDefined();
    expect(result?.id).toBe(createdAllocation.id);
    expect(result?.ip_address).toBe('192.168.1.100');
    expect(result?.asset_name).toBe('Test Server');
    expect(result?.hardware_asset_id).toBeNull();
    expect(result?.software_asset_id).toBeNull();
    expect(result?.description).toBe('Test IP allocation');
    expect(result?.created_at).toBeInstanceOf(Date);
    expect(result?.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent IP allocation', async () => {
    const params: IdParam = { id: 999 };
    const result = await getIpAllocation(params);

    expect(result).toBeNull();
  });

  it('should get IP allocation with hardware asset reference', async () => {
    // Create a hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Hardware',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge R740',
        location: 'Datacenter A'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create IP allocation with hardware asset reference
    const ipAllocationResult = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.101',
        asset_name: 'Production Server',
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: null,
        description: 'Production server IP'
      })
      .returning()
      .execute();

    const createdAllocation = ipAllocationResult[0];

    // Test the handler
    const params: IdParam = { id: createdAllocation.id };
    const result = await getIpAllocation(params);

    // Verify the result includes hardware asset reference
    expect(result).toBeDefined();
    expect(result?.id).toBe(createdAllocation.id);
    expect(result?.ip_address).toBe('192.168.1.101');
    expect(result?.asset_name).toBe('Production Server');
    expect(result?.hardware_asset_id).toBe(hardwareAsset.id);
    expect(result?.software_asset_id).toBeNull();
    expect(result?.description).toBe('Production server IP');
  });

  it('should get IP allocation with software asset reference', async () => {
    // Create a hardware asset first (for host reference)
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant DL380',
        location: 'Datacenter B'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create a software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web Application',
        type: 'application',
        host_id: hardwareAsset.id,
        description: 'Main web application'
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP allocation with software asset reference
    const ipAllocationResult = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.102',
        asset_name: 'Web App Instance',
        hardware_asset_id: null,
        software_asset_id: softwareAsset.id,
        description: 'Web application IP'
      })
      .returning()
      .execute();

    const createdAllocation = ipAllocationResult[0];

    // Test the handler
    const params: IdParam = { id: createdAllocation.id };
    const result = await getIpAllocation(params);

    // Verify the result includes software asset reference
    expect(result).toBeDefined();
    expect(result?.id).toBe(createdAllocation.id);
    expect(result?.ip_address).toBe('192.168.1.102');
    expect(result?.asset_name).toBe('Web App Instance');
    expect(result?.hardware_asset_id).toBeNull();
    expect(result?.software_asset_id).toBe(softwareAsset.id);
    expect(result?.description).toBe('Web application IP');
  });

  it('should get IP allocation with both hardware and software asset references', async () => {
    // Create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Database Server',
        type: 'server',
        make: 'IBM',
        model: 'System x3650 M5',
        location: 'Datacenter C'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create a software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Database Instance',
        type: 'service',
        host_id: hardwareAsset.id,
        description: 'PostgreSQL database'
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP allocation with both asset references
    const ipAllocationResult = await db.insert(ipAllocationsTable)
      .values({
        ip_address: '192.168.1.103',
        asset_name: 'DB Server Instance',
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: softwareAsset.id,
        description: 'Database server with service IP'
      })
      .returning()
      .execute();

    const createdAllocation = ipAllocationResult[0];

    // Test the handler
    const params: IdParam = { id: createdAllocation.id };
    const result = await getIpAllocation(params);

    // Verify the result includes both asset references
    expect(result).toBeDefined();
    expect(result?.id).toBe(createdAllocation.id);
    expect(result?.ip_address).toBe('192.168.1.103');
    expect(result?.asset_name).toBe('DB Server Instance');
    expect(result?.hardware_asset_id).toBe(hardwareAsset.id);
    expect(result?.software_asset_id).toBe(softwareAsset.id);
    expect(result?.description).toBe('Database server with service IP');
  });

  it('should handle database query correctly', async () => {
    // Create multiple IP allocations
    const allocations = [
      {
        ip_address: '192.168.1.10',
        asset_name: 'Server 1',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'First server'
      },
      {
        ip_address: '192.168.1.11',
        asset_name: 'Server 2',
        hardware_asset_id: null,
        software_asset_id: null,
        description: 'Second server'
      }
    ];

    const createdResults = await db.insert(ipAllocationsTable)
      .values(allocations)
      .returning()
      .execute();

    // Test getting specific allocation
    const targetAllocation = createdResults[1]; // Get the second one
    const params: IdParam = { id: targetAllocation.id };
    const result = await getIpAllocation(params);

    // Verify we got the correct allocation
    expect(result).toBeDefined();
    expect(result?.id).toBe(targetAllocation.id);
    expect(result?.ip_address).toBe('192.168.1.11');
    expect(result?.asset_name).toBe('Server 2');
    expect(result?.description).toBe('Second server');

    // Verify database state - should still have both records
    const allAllocations = await db.select()
      .from(ipAllocationsTable)
      .execute();

    expect(allAllocations).toHaveLength(2);
  });
});
