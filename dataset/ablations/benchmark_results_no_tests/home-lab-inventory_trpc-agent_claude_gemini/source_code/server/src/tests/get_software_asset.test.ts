import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type IdInput, type CreateSoftwareAssetInput, type CreateHardwareAssetInput } from '../schema';
import { getSoftwareAsset } from '../handlers/get_software_asset';

describe('getSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a software asset by id', async () => {
    // Create a hardware asset first for the software to reference
    const hardwareInput: CreateHardwareAssetInput = {
      name: 'Host Server',
      type: 'server',
      status: 'active',
      model: 'Dell PowerEdge',
      manufacturer: 'Dell',
      serial_number: 'SN123456',
      location: 'Data Center A',
      notes: 'Primary host server'
    };

    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: hardwareInput.name,
        type: hardwareInput.type,
        status: hardwareInput.status,
        model: hardwareInput.model,
        manufacturer: hardwareInput.manufacturer,
        serial_number: hardwareInput.serial_number,
        location: hardwareInput.location,
        notes: hardwareInput.notes
      })
      .returning()
      .execute();

    // Create a software asset
    const softwareInput: CreateSoftwareAssetInput = {
      name: 'Web Server VM',
      type: 'virtual_machine',
      status: 'running',
      host_hardware_id: hardwareResult[0].id,
      operating_system: 'Ubuntu 22.04',
      version: '1.0.0',
      notes: 'Production web server'
    };

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: softwareInput.name,
        type: softwareInput.type,
        status: softwareInput.status,
        host_hardware_id: softwareInput.host_hardware_id,
        operating_system: softwareInput.operating_system,
        version: softwareInput.version,
        notes: softwareInput.notes
      })
      .returning()
      .execute();

    const testInput: IdInput = { id: softwareResult[0].id };

    // Test the handler
    const result = await getSoftwareAsset(testInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(softwareResult[0].id);
    expect(result!.name).toEqual('Web Server VM');
    expect(result!.type).toEqual('virtual_machine');
    expect(result!.status).toEqual('running');
    expect(result!.host_hardware_id).toEqual(hardwareResult[0].id);
    expect(result!.operating_system).toEqual('Ubuntu 22.04');
    expect(result!.version).toEqual('1.0.0');
    expect(result!.notes).toEqual('Production web server');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent software asset', async () => {
    const testInput: IdInput = { id: 99999 };

    const result = await getSoftwareAsset(testInput);

    expect(result).toBeNull();
  });

  it('should handle software asset without host hardware', async () => {
    // Create a software asset without host hardware reference
    const softwareInput: CreateSoftwareAssetInput = {
      name: 'Standalone Service',
      type: 'service',
      status: 'running',
      host_hardware_id: null,
      operating_system: null,
      version: '2.1.0',
      notes: null
    };

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: softwareInput.name,
        type: softwareInput.type,
        status: softwareInput.status,
        host_hardware_id: softwareInput.host_hardware_id,
        operating_system: softwareInput.operating_system,
        version: softwareInput.version,
        notes: softwareInput.notes
      })
      .returning()
      .execute();

    const testInput: IdInput = { id: softwareResult[0].id };

    // Test the handler
    const result = await getSoftwareAsset(testInput);

    expect(result).toBeTruthy();
    expect(result!.id).toEqual(softwareResult[0].id);
    expect(result!.name).toEqual('Standalone Service');
    expect(result!.type).toEqual('service');
    expect(result!.status).toEqual('running');
    expect(result!.host_hardware_id).toBeNull();
    expect(result!.operating_system).toBeNull();
    expect(result!.version).toEqual('2.1.0');
    expect(result!.notes).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should verify software asset is saved in database correctly', async () => {
    // Create a software asset with minimal required fields
    const softwareInput: CreateSoftwareAssetInput = {
      name: 'Test Application',
      type: 'application',
      status: 'stopped'
    };

    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: softwareInput.name,
        type: softwareInput.type,
        status: softwareInput.status
      })
      .returning()
      .execute();

    const testInput: IdInput = { id: softwareResult[0].id };

    // Test the handler
    const result = await getSoftwareAsset(testInput);

    // Verify the result matches what's in the database
    expect(result).toBeTruthy();
    expect(result!.name).toEqual('Test Application');
    expect(result!.type).toEqual('application');
    expect(result!.status).toEqual('stopped');
    expect(result!.host_hardware_id).toBeNull();
    expect(result!.operating_system).toBeNull();
    expect(result!.version).toBeNull();
    expect(result!.notes).toBeNull();

    // Verify timestamps are set correctly
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at).toEqual(result!.updated_at);
  });
});
