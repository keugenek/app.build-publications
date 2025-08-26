import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { type UpdateSoftwareAssetInput } from '../schema';
import { updateSoftwareAsset } from '../handlers/update_software_asset';
import { eq } from 'drizzle-orm';

describe('updateSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testSoftwareAssetId: number;
  let testHardwareAssetId: number;
  let testIpAddressId: number;

  beforeEach(async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R750',
        serial_number: 'ABC123',
        description: 'Test server for software'
      })
      .returning()
      .execute();
    testHardwareAssetId = hardwareResult[0].id;

    // Create prerequisite IP address allocation
    const ipResult = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Web Server',
        status: 'assigned'
      })
      .returning()
      .execute();
    testIpAddressId = ipResult[0].id;

    // Create test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Original Software',
        type: 'Application',
        hardware_asset_id: testHardwareAssetId,
        operating_system: 'Ubuntu 20.04',
        purpose: 'Web Development',
        resource_allocation: '4 CPU, 8GB RAM',
        ip_address_id: testIpAddressId
      })
      .returning()
      .execute();
    testSoftwareAssetId = softwareResult[0].id;
  });

  it('should update all software asset fields', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      name: 'Updated Software Name',
      type: 'Database',
      hardware_asset_id: testHardwareAssetId,
      operating_system: 'Ubuntu 22.04',
      purpose: 'Data Analytics',
      resource_allocation: '8 CPU, 16GB RAM',
      ip_address_id: testIpAddressId
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.id).toEqual(testSoftwareAssetId);
    expect(result.name).toEqual('Updated Software Name');
    expect(result.type).toEqual('Database');
    expect(result.hardware_asset_id).toEqual(testHardwareAssetId);
    expect(result.operating_system).toEqual('Ubuntu 22.04');
    expect(result.purpose).toEqual('Data Analytics');
    expect(result.resource_allocation).toEqual('8 CPU, 16GB RAM');
    expect(result.ip_address_id).toEqual(testIpAddressId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only specified fields', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      name: 'Partially Updated Software',
      operating_system: 'CentOS 8'
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.id).toEqual(testSoftwareAssetId);
    expect(result.name).toEqual('Partially Updated Software');
    expect(result.operating_system).toEqual('CentOS 8');
    expect(result.type).toEqual('Application'); // Should remain unchanged
    expect(result.purpose).toEqual('Web Development'); // Should remain unchanged
    expect(result.hardware_asset_id).toEqual(testHardwareAssetId); // Should remain unchanged
  });

  it('should save updates to database', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      name: 'Database Updated Name',
      type: 'System Software'
    };

    await updateSoftwareAsset(updateInput);

    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, testSoftwareAssetId))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Database Updated Name');
    expect(softwareAssets[0].type).toEqual('System Software');
    expect(softwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set foreign keys to null', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      hardware_asset_id: null,
      ip_address_id: null
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.hardware_asset_id).toBeNull();
    expect(result.ip_address_id).toBeNull();
  });

  it('should update foreign key references when valid', async () => {
    // Create another hardware asset
    const newHardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'New Server',
        type: 'Server',
        make: 'HP',
        model: 'ProLiant DL380',
        serial_number: 'XYZ789'
      })
      .returning()
      .execute();

    // Create another IP address allocation
    const newIpResult = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.200',
        purpose: 'Database Server',
        status: 'available'
      })
      .returning()
      .execute();

    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      hardware_asset_id: newHardwareResult[0].id,
      ip_address_id: newIpResult[0].id
    };

    const result = await updateSoftwareAsset(updateInput);

    expect(result.hardware_asset_id).toEqual(newHardwareResult[0].id);
    expect(result.ip_address_id).toEqual(newIpResult[0].id);
  });

  it('should throw error for non-existent software asset', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: 99999,
      name: 'Non-existent Software'
    };

    expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/software asset with id 99999 not found/i);
  });

  it('should throw error for invalid hardware asset reference', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      hardware_asset_id: 99999
    };

    expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/hardware asset with id 99999 not found/i);
  });

  it('should throw error for invalid IP address reference', async () => {
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      ip_address_id: 99999
    };

    expect(updateSoftwareAsset(updateInput)).rejects.toThrow(/ip address allocation with id 99999 not found/i);
  });

  it('should update timestamps correctly', async () => {
    const beforeUpdate = new Date();
    
    const updateInput: UpdateSoftwareAssetInput = {
      id: testSoftwareAssetId,
      name: 'Timestamp Test Software'
    };

    const result = await updateSoftwareAsset(updateInput);
    const afterUpdate = new Date();

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at >= beforeUpdate).toBe(true);
    expect(result.updated_at <= afterUpdate).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });
});
