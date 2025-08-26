import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAllocationInput, type CreateHardwareAssetInput, type CreateSoftwareAssetInput } from '../schema';
import { getIpAllocations } from '../handlers/get_ip_allocations';

// Test data
const testHardwareAsset: CreateHardwareAssetInput = {
  name: 'Test Server',
  type: 'server',
  make: 'Dell',
  model: 'PowerEdge R740',
  location: 'Data Center 1'
};

const testSoftwareAsset: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'vm',
  host_id: null, // Will be set after hardware asset creation
  description: 'Test virtual machine'
};

const testIpAllocation1: CreateIpAllocationInput = {
  ip_address: '192.168.1.10',
  asset_name: 'Test Server',
  hardware_asset_id: null, // Will be set after hardware asset creation
  software_asset_id: null,
  description: 'Primary server IP'
};

const testIpAllocation2: CreateIpAllocationInput = {
  ip_address: '192.168.1.11',
  asset_name: 'Test VM',
  hardware_asset_id: null,
  software_asset_id: null, // Will be set after software asset creation
  description: 'VM IP address'
};

const testIpAllocation3: CreateIpAllocationInput = {
  ip_address: '10.0.0.5',
  asset_name: 'Standalone Device',
  hardware_asset_id: null,
  software_asset_id: null,
  description: 'Unlinked IP allocation'
};

describe('getIpAllocations', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no IP allocations exist', async () => {
    const result = await getIpAllocations();

    expect(result).toEqual([]);
  });

  it('should return all IP allocations', async () => {
    // Create prerequisite assets first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: testHardwareAsset.name,
        type: testHardwareAsset.type,
        make: testHardwareAsset.make,
        model: testHardwareAsset.model,
        location: testHardwareAsset.location
      })
      .returning()
      .execute();

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: testSoftwareAsset.name,
        type: testSoftwareAsset.type,
        host_id: hardwareResult[0].id,
        description: testSoftwareAsset.description
      })
      .returning()
      .execute();

    // Create test IP allocations
    await db.insert(ipAllocationsTable)
      .values([
        {
          ip_address: testIpAllocation1.ip_address,
          asset_name: testIpAllocation1.asset_name,
          hardware_asset_id: hardwareResult[0].id,
          software_asset_id: null,
          description: testIpAllocation1.description
        },
        {
          ip_address: testIpAllocation2.ip_address,
          asset_name: testIpAllocation2.asset_name,
          hardware_asset_id: null,
          software_asset_id: softwareResult[0].id,
          description: testIpAllocation2.description
        },
        {
          ip_address: testIpAllocation3.ip_address,
          asset_name: testIpAllocation3.asset_name,
          hardware_asset_id: null,
          software_asset_id: null,
          description: testIpAllocation3.description
        }
      ])
      .execute();

    const result = await getIpAllocations();

    // Should return 3 allocations
    expect(result).toHaveLength(3);

    // Check first allocation (hardware-linked)
    const allocation1 = result.find(a => a.ip_address === '192.168.1.10');
    expect(allocation1).toBeDefined();
    expect(allocation1!.asset_name).toEqual('Test Server');
    expect(allocation1!.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(allocation1!.software_asset_id).toBeNull();
    expect(allocation1!.description).toEqual('Primary server IP');
    expect(allocation1!.created_at).toBeInstanceOf(Date);
    expect(allocation1!.updated_at).toBeInstanceOf(Date);

    // Check second allocation (software-linked)
    const allocation2 = result.find(a => a.ip_address === '192.168.1.11');
    expect(allocation2).toBeDefined();
    expect(allocation2!.asset_name).toEqual('Test VM');
    expect(allocation2!.hardware_asset_id).toBeNull();
    expect(allocation2!.software_asset_id).toEqual(softwareResult[0].id);
    expect(allocation2!.description).toEqual('VM IP address');

    // Check third allocation (standalone)
    const allocation3 = result.find(a => a.ip_address === '10.0.0.5');
    expect(allocation3).toBeDefined();
    expect(allocation3!.asset_name).toEqual('Standalone Device');
    expect(allocation3!.hardware_asset_id).toBeNull();
    expect(allocation3!.software_asset_id).toBeNull();
    expect(allocation3!.description).toEqual('Unlinked IP allocation');

    // Verify all have proper IDs and timestamps
    result.forEach(allocation => {
      expect(allocation.id).toBeDefined();
      expect(typeof allocation.id).toBe('number');
      expect(allocation.created_at).toBeInstanceOf(Date);
      expect(allocation.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should handle IP allocations with null descriptions', async () => {
    // Create IP allocation without description
    await db.insert(ipAllocationsTable)
      .values({
        ip_address: '172.16.0.1',
        asset_name: 'Minimal Device',
        hardware_asset_id: null,
        software_asset_id: null,
        description: null
      })
      .execute();

    const result = await getIpAllocations();

    expect(result).toHaveLength(1);
    expect(result[0].ip_address).toEqual('172.16.0.1');
    expect(result[0].asset_name).toEqual('Minimal Device');
    expect(result[0].description).toBeNull();
  });

  it('should preserve order and return consistent results', async () => {
    // Create multiple IP allocations
    const allocations = [
      { ip: '192.168.1.1', name: 'Device A' },
      { ip: '192.168.1.2', name: 'Device B' },
      { ip: '192.168.1.3', name: 'Device C' }
    ];

    for (const allocation of allocations) {
      await db.insert(ipAllocationsTable)
        .values({
          ip_address: allocation.ip,
          asset_name: allocation.name,
          hardware_asset_id: null,
          software_asset_id: null,
          description: null
        })
        .execute();
    }

    const result1 = await getIpAllocations();
    const result2 = await getIpAllocations();

    expect(result1).toHaveLength(3);
    expect(result2).toHaveLength(3);
    
    // Results should be consistent between calls
    expect(result1.map(a => a.ip_address)).toEqual(result2.map(a => a.ip_address));
    expect(result1.map(a => a.asset_name)).toEqual(result2.map(a => a.asset_name));
  });
});
