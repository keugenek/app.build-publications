import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Test input with all nullable fields
const testInput: CreateSoftwareAssetInput = {
  name: 'Test Software',
  type: 'Application',
  hardware_asset_id: null,
  operating_system: 'Ubuntu 22.04',
  purpose: 'Development environment',
  resource_allocation: '4 CPU, 8GB RAM',
  ip_address_id: null
};

// Minimal test input
const minimalTestInput: CreateSoftwareAssetInput = {
  name: 'Minimal Software',
  type: 'Service',
  hardware_asset_id: null,
  operating_system: null,
  purpose: null,
  resource_allocation: null,
  ip_address_id: null
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset with all fields', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Software');
    expect(result.type).toEqual('Application');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.operating_system).toEqual('Ubuntu 22.04');
    expect(result.purpose).toEqual('Development environment');
    expect(result.resource_allocation).toEqual('4 CPU, 8GB RAM');
    expect(result.ip_address_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a software asset with minimal required fields', async () => {
    const result = await createSoftwareAsset(minimalTestInput);

    // Basic field validation
    expect(result.name).toEqual('Minimal Software');
    expect(result.type).toEqual('Service');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.operating_system).toBeNull();
    expect(result.purpose).toBeNull();
    expect(result.resource_allocation).toBeNull();
    expect(result.ip_address_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save software asset to database', async () => {
    const result = await createSoftwareAsset(testInput);

    // Query using proper drizzle syntax
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Test Software');
    expect(softwareAssets[0].type).toEqual('Application');
    expect(softwareAssets[0].operating_system).toEqual('Ubuntu 22.04');
    expect(softwareAssets[0].purpose).toEqual('Development environment');
    expect(softwareAssets[0].resource_allocation).toEqual('4 CPU, 8GB RAM');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(softwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create software asset with hardware asset reference', async () => {
    // First create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'ABC123',
        description: 'Test server for software'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Create software asset with hardware reference
    const inputWithHardware: CreateSoftwareAssetInput = {
      ...testInput,
      hardware_asset_id: hardwareAssetId
    };

    const result = await createSoftwareAsset(inputWithHardware);

    expect(result.hardware_asset_id).toEqual(hardwareAssetId);

    // Verify it's saved correctly
    const savedAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(savedAsset[0].hardware_asset_id).toEqual(hardwareAssetId);
  });

  it('should create software asset with IP address reference', async () => {
    // First create an IP address allocation
    const ipResult = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Web server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'available'
      })
      .returning()
      .execute();

    const ipAddressId = ipResult[0].id;

    // Create software asset with IP reference
    const inputWithIp: CreateSoftwareAssetInput = {
      ...testInput,
      ip_address_id: ipAddressId
    };

    const result = await createSoftwareAsset(inputWithIp);

    expect(result.ip_address_id).toEqual(ipAddressId);

    // Verify it's saved correctly
    const savedAsset = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(savedAsset[0].ip_address_id).toEqual(ipAddressId);
  });

  it('should create software asset with both hardware and IP references', async () => {
    // Create prerequisite data
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R740',
        serial_number: 'ABC123',
        description: 'Test server'
      })
      .returning()
      .execute();

    const ipResult = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Application server',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'available'
      })
      .returning()
      .execute();

    // Create software asset with both references
    const inputWithBoth: CreateSoftwareAssetInput = {
      ...testInput,
      hardware_asset_id: hardwareResult[0].id,
      ip_address_id: ipResult[0].id
    };

    const result = await createSoftwareAsset(inputWithBoth);

    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.ip_address_id).toEqual(ipResult[0].id);
    expect(result.name).toEqual('Test Software');
    expect(result.type).toEqual('Application');
    expect(result.operating_system).toEqual('Ubuntu 22.04');
    expect(result.purpose).toEqual('Development environment');
    expect(result.resource_allocation).toEqual('4 CPU, 8GB RAM');
  });

  it('should handle different software types correctly', async () => {
    const serviceInput: CreateSoftwareAssetInput = {
      name: 'Database Service',
      type: 'Database',
      hardware_asset_id: null,
      operating_system: 'CentOS 8',
      purpose: 'Data storage',
      resource_allocation: '8 CPU, 16GB RAM',
      ip_address_id: null
    };

    const result = await createSoftwareAsset(serviceInput);

    expect(result.name).toEqual('Database Service');
    expect(result.type).toEqual('Database');
    expect(result.operating_system).toEqual('CentOS 8');
    expect(result.purpose).toEqual('Data storage');
    expect(result.resource_allocation).toEqual('8 CPU, 16GB RAM');
  });
});
