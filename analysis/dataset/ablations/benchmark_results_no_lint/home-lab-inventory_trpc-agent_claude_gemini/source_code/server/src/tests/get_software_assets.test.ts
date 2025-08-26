import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { getSoftwareAssets } from '../handlers/get_software_assets';
import { type CreateSoftwareAssetInput } from '../schema';

describe('getSoftwareAssets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no software assets exist', async () => {
    const result = await getSoftwareAssets();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all software assets', async () => {
    // Create prerequisite hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Physical Server',
        make: 'Dell',
        model: 'PowerEdge R750',
        serial_number: 'SN123456',
        description: 'Test hardware for software assets'
      })
      .returning()
      .execute();

    // Create prerequisite IP address allocation
    const ipAllocation = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Web Server',
        status: 'allocated'
      })
      .returning()
      .execute();

    // Create test software assets with all possible field combinations
    const testAssets = [
      {
        name: 'Web Server VM',
        type: 'Virtual Machine',
        hardware_asset_id: hardwareAsset[0].id,
        operating_system: 'Ubuntu 22.04',
        purpose: 'Web hosting',
        resource_allocation: '4 CPU, 8GB RAM',
        ip_address_id: ipAllocation[0].id
      },
      {
        name: 'Database Instance',
        type: 'Container',
        hardware_asset_id: null,
        operating_system: 'Alpine Linux',
        purpose: 'Database hosting',
        resource_allocation: '2 CPU, 4GB RAM',
        ip_address_id: null
      },
      {
        name: 'Monitoring Service',
        type: 'Service',
        hardware_asset_id: hardwareAsset[0].id,
        operating_system: null,
        purpose: null,
        resource_allocation: null,
        ip_address_id: ipAllocation[0].id
      }
    ];

    // Insert test data
    await db.insert(softwareAssetsTable)
      .values(testAssets)
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(3);
    
    // Verify first asset with all fields populated
    const webServerVM = result.find(asset => asset.name === 'Web Server VM');
    expect(webServerVM).toBeDefined();
    expect(webServerVM!.type).toEqual('Virtual Machine');
    expect(webServerVM!.hardware_asset_id).toEqual(hardwareAsset[0].id);
    expect(webServerVM!.operating_system).toEqual('Ubuntu 22.04');
    expect(webServerVM!.purpose).toEqual('Web hosting');
    expect(webServerVM!.resource_allocation).toEqual('4 CPU, 8GB RAM');
    expect(webServerVM!.ip_address_id).toEqual(ipAllocation[0].id);
    expect(webServerVM!.id).toBeDefined();
    expect(webServerVM!.created_at).toBeInstanceOf(Date);
    expect(webServerVM!.updated_at).toBeInstanceOf(Date);

    // Verify second asset with some null fields
    const databaseInstance = result.find(asset => asset.name === 'Database Instance');
    expect(databaseInstance).toBeDefined();
    expect(databaseInstance!.type).toEqual('Container');
    expect(databaseInstance!.hardware_asset_id).toBeNull();
    expect(databaseInstance!.operating_system).toEqual('Alpine Linux');
    expect(databaseInstance!.purpose).toEqual('Database hosting');
    expect(databaseInstance!.resource_allocation).toEqual('2 CPU, 4GB RAM');
    expect(databaseInstance!.ip_address_id).toBeNull();

    // Verify third asset with minimal fields
    const monitoringService = result.find(asset => asset.name === 'Monitoring Service');
    expect(monitoringService).toBeDefined();
    expect(monitoringService!.type).toEqual('Service');
    expect(monitoringService!.hardware_asset_id).toEqual(hardwareAsset[0].id);
    expect(monitoringService!.operating_system).toBeNull();
    expect(monitoringService!.purpose).toBeNull();
    expect(monitoringService!.resource_allocation).toBeNull();
    expect(monitoringService!.ip_address_id).toEqual(ipAllocation[0].id);

    // Verify all assets have required fields
    result.forEach(asset => {
      expect(asset.id).toBeDefined();
      expect(typeof asset.id).toBe('number');
      expect(asset.name).toBeDefined();
      expect(typeof asset.name).toBe('string');
      expect(asset.type).toBeDefined();
      expect(typeof asset.type).toBe('string');
      expect(asset.created_at).toBeInstanceOf(Date);
      expect(asset.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should return software assets in creation order', async () => {
    // Create test software assets with time gaps to ensure ordering
    const firstAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'First Asset',
        type: 'Virtual Machine'
      })
      .returning()
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1));

    const secondAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Second Asset',
        type: 'Container'
      })
      .returning()
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(2);
    
    // Verify assets are returned (database default ordering by primary key)
    expect(result[0].name).toEqual('First Asset');
    expect(result[1].name).toEqual('Second Asset');
    expect(result[0].id).toBeLessThan(result[1].id);
  });

  it('should handle large number of software assets', async () => {
    // Create multiple software assets to test performance and consistency
    const assetsToCreate = [];
    for (let i = 1; i <= 50; i++) {
      assetsToCreate.push({
        name: `Asset ${i}`,
        type: i % 2 === 0 ? 'Virtual Machine' : 'Container',
        operating_system: i % 3 === 0 ? 'Ubuntu 22.04' : null,
        purpose: i % 4 === 0 ? `Purpose ${i}` : null
      });
    }

    await db.insert(softwareAssetsTable)
      .values(assetsToCreate)
      .execute();

    const result = await getSoftwareAssets();

    expect(result).toHaveLength(50);
    
    // Verify all assets have unique IDs and proper structure
    const ids = result.map(asset => asset.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toEqual(50);

    // Verify data integrity for a few sample assets
    const asset10 = result.find(asset => asset.name === 'Asset 10');
    expect(asset10).toBeDefined();
    expect(asset10!.type).toEqual('Virtual Machine');
    expect(asset10!.operating_system).toBeNull();
    expect(asset10!.purpose).toBeNull();

    const asset12 = result.find(asset => asset.name === 'Asset 12');
    expect(asset12).toBeDefined();
    expect(asset12!.type).toEqual('Virtual Machine');
    expect(asset12!.operating_system).toEqual('Ubuntu 22.04');
    expect(asset12!.purpose).toEqual('Purpose 12');
  });
});
