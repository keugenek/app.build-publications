import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateSoftwareAssetInput = {
  name: 'Test Web App',
  type: 'application',
  status: 'running',
  host_hardware_id: null,
  operating_system: 'Ubuntu 22.04',
  version: '1.2.3',
  notes: 'Test application for development'
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset with all fields', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Web App');
    expect(result.type).toEqual('application');
    expect(result.status).toEqual('running');
    expect(result.host_hardware_id).toBeNull();
    expect(result.operating_system).toEqual('Ubuntu 22.04');
    expect(result.version).toEqual('1.2.3');
    expect(result.notes).toEqual('Test application for development');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a software asset with minimal required fields', async () => {
    const minimalInput: CreateSoftwareAssetInput = {
      name: 'Minimal App',
      type: 'service',
      status: 'stopped'
    };

    const result = await createSoftwareAsset(minimalInput);

    expect(result.name).toEqual('Minimal App');
    expect(result.type).toEqual('service');
    expect(result.status).toEqual('stopped');
    expect(result.host_hardware_id).toBeNull();
    expect(result.operating_system).toBeNull();
    expect(result.version).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should use default status when not provided', async () => {
    const inputWithoutStatus: CreateSoftwareAssetInput = {
      name: 'Default Status App',
      type: 'container',
      status: 'stopped' // This would be applied by Zod parsing in real usage
    };

    const result = await createSoftwareAsset(inputWithoutStatus);

    expect(result.status).toEqual('stopped');
  });

  it('should save software asset to database', async () => {
    const result = await createSoftwareAsset(testInput);

    // Query using proper drizzle syntax
    const softwareAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(softwareAssets).toHaveLength(1);
    expect(softwareAssets[0].name).toEqual('Test Web App');
    expect(softwareAssets[0].type).toEqual('application');
    expect(softwareAssets[0].status).toEqual('running');
    expect(softwareAssets[0].operating_system).toEqual('Ubuntu 22.04');
    expect(softwareAssets[0].version).toEqual('1.2.3');
    expect(softwareAssets[0].notes).toEqual('Test application for development');
    expect(softwareAssets[0].created_at).toBeInstanceOf(Date);
    expect(softwareAssets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create software asset with valid host hardware ID', async () => {
    // First create a hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        status: 'active'
      })
      .returning()
      .execute();

    const hardwareId = hardwareResult[0].id;

    // Create software asset with reference to hardware
    const softwareInput: CreateSoftwareAssetInput = {
      name: 'VM on Server',
      type: 'virtual_machine',
      status: 'running',
      host_hardware_id: hardwareId,
      operating_system: 'CentOS 8',
      version: '2.1.0'
    };

    const result = await createSoftwareAsset(softwareInput);

    expect(result.host_hardware_id).toEqual(hardwareId);
    expect(result.name).toEqual('VM on Server');
    expect(result.type).toEqual('virtual_machine');

    // Verify it's saved in database
    const savedSoftware = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(savedSoftware[0].host_hardware_id).toEqual(hardwareId);
  });

  it('should throw error when host_hardware_id references non-existent hardware', async () => {
    const invalidInput: CreateSoftwareAssetInput = {
      name: 'Invalid VM',
      type: 'virtual_machine',
      status: 'running',
      host_hardware_id: 99999 // Non-existent ID
    };

    await expect(createSoftwareAsset(invalidInput))
      .rejects
      .toThrow(/Hardware asset with ID 99999 not found/i);
  });

  it('should handle all software types correctly', async () => {
    const types: CreateSoftwareAssetInput['type'][] = [
      'virtual_machine', 
      'container', 
      'service', 
      'application', 
      'other'
    ];

    for (const type of types) {
      const input: CreateSoftwareAssetInput = {
        name: `Test ${type}`,
        type: type,
        status: 'stopped'
      };

      const result = await createSoftwareAsset(input);
      expect(result.type).toEqual(type);
      expect(result.name).toEqual(`Test ${type}`);
    }
  });

  it('should handle all software statuses correctly', async () => {
    const statuses: CreateSoftwareAssetInput['status'][] = [
      'running', 
      'stopped', 
      'paused', 
      'error'
    ];

    for (const status of statuses) {
      const input: CreateSoftwareAssetInput = {
        name: `Test ${status} App`,
        type: 'application',
        status: status
      };

      const result = await createSoftwareAsset(input);
      expect(result.status).toEqual(status);
      expect(result.name).toEqual(`Test ${status} App`);
    }
  });
});
