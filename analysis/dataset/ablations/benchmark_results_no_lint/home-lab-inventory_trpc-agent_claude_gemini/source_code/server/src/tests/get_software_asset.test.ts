import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressAllocationsTable } from '../db/schema';
import { type DeleteInput, type CreateSoftwareAssetInput } from '../schema';
import { getSoftwareAsset } from '../handlers/get_software_asset';
import { eq } from 'drizzle-orm';

describe('getSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should get a software asset by id', async () => {
    // Create a software asset first
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test Software',
        type: 'Application',
        hardware_asset_id: null,
        operating_system: 'Linux',
        purpose: 'Testing',
        resource_allocation: '4GB RAM, 2 CPU',
        ip_address_id: null
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: DeleteInput = { id: createdAsset.id };

    const result = await getSoftwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Test Software');
    expect(result!.type).toEqual('Application');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.operating_system).toEqual('Linux');
    expect(result!.purpose).toEqual('Testing');
    expect(result!.resource_allocation).toEqual('4GB RAM, 2 CPU');
    expect(result!.ip_address_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent software asset', async () => {
    const input: DeleteInput = { id: 999 };

    const result = await getSoftwareAsset(input);

    expect(result).toBeNull();
  });

  it('should get software asset with foreign key relationships', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        make: 'Dell',
        model: 'PowerEdge R750',
        serial_number: 'SN12345',
        description: 'Test server'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create prerequisite IP address allocation
    const ipResult = await db.insert(ipAddressAllocationsTable)
      .values({
        ip_address: '192.168.1.100',
        purpose: 'Test allocation',
        assigned_hardware_id: null,
        assigned_software_id: null,
        status: 'allocated'
      })
      .returning()
      .execute();

    const ipAllocation = ipResult[0];

    // Create software asset with foreign keys
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web Server',
        type: 'Virtual Machine',
        hardware_asset_id: hardwareAsset.id,
        operating_system: 'Ubuntu 22.04',
        purpose: 'Web hosting',
        resource_allocation: '8GB RAM, 4 CPU',
        ip_address_id: ipAllocation.id
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: DeleteInput = { id: createdAsset.id };

    const result = await getSoftwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Web Server');
    expect(result!.type).toEqual('Virtual Machine');
    expect(result!.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(result!.operating_system).toEqual('Ubuntu 22.04');
    expect(result!.purpose).toEqual('Web hosting');
    expect(result!.resource_allocation).toEqual('8GB RAM, 4 CPU');
    expect(result!.ip_address_id).toEqual(ipAllocation.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify software asset exists in database after retrieval', async () => {
    // Create software asset
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Database Server',
        type: 'Virtual Machine',
        hardware_asset_id: null,
        operating_system: 'CentOS 8',
        purpose: 'Database hosting',
        resource_allocation: '16GB RAM, 8 CPU',
        ip_address_id: null
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: DeleteInput = { id: createdAsset.id };

    // Get the software asset using the handler
    const result = await getSoftwareAsset(input);

    // Verify it exists in database
    const dbAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, createdAsset.id))
      .execute();

    expect(dbAssets).toHaveLength(1);
    expect(dbAssets[0].name).toEqual('Database Server');
    expect(dbAssets[0].type).toEqual('Virtual Machine');
    expect(dbAssets[0].operating_system).toEqual('CentOS 8');
    
    // Verify handler result matches database
    expect(result!.id).toEqual(dbAssets[0].id);
    expect(result!.name).toEqual(dbAssets[0].name);
    expect(result!.type).toEqual(dbAssets[0].type);
    expect(result!.operating_system).toEqual(dbAssets[0].operating_system);
  });

  it('should handle software asset with minimal data', async () => {
    // Create software asset with only required fields
    const insertResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Minimal Software',
        type: 'Service',
        hardware_asset_id: null,
        operating_system: null,
        purpose: null,
        resource_allocation: null,
        ip_address_id: null
      })
      .returning()
      .execute();

    const createdAsset = insertResult[0];
    const input: DeleteInput = { id: createdAsset.id };

    const result = await getSoftwareAsset(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdAsset.id);
    expect(result!.name).toEqual('Minimal Software');
    expect(result!.type).toEqual('Service');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.operating_system).toBeNull();
    expect(result!.purpose).toBeNull();
    expect(result!.resource_allocation).toBeNull();
    expect(result!.ip_address_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});
