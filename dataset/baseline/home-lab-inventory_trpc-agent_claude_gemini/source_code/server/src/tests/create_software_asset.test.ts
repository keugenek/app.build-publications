import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput } from '../schema';
import { createSoftwareAsset } from '../handlers/create_software_asset';
import { eq } from 'drizzle-orm';

// Test input without host_id
const testInput: CreateSoftwareAssetInput = {
  name: 'Test Service',
  type: 'service',
  host_id: null,
  description: 'A test software asset'
};

// Test input with host_id
const testInputWithHost: CreateSoftwareAssetInput = {
  name: 'Web Application',
  type: 'application',
  host_id: 1,
  description: 'A web application running on server'
};

describe('createSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a software asset without host_id', async () => {
    const result = await createSoftwareAsset(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Service');
    expect(result.type).toEqual('service');
    expect(result.host_id).toBeNull();
    expect(result.description).toEqual('A test software asset');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save software asset to database', async () => {
    const result = await createSoftwareAsset(testInput);

    // Query database to verify persistence
    const assets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].name).toEqual('Test Service');
    expect(assets[0].type).toEqual('service');
    expect(assets[0].host_id).toBeNull();
    expect(assets[0].description).toEqual('A test software asset');
    expect(assets[0].created_at).toBeInstanceOf(Date);
    expect(assets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create a software asset with valid host_id', async () => {
    // First create a hardware asset to reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        make: 'Dell',
        model: 'PowerEdge R730',
        location: 'Datacenter A'
      })
      .returning()
      .execute();

    const hostId = hardwareResult[0].id;

    // Create software asset with valid host_id
    const result = await createSoftwareAsset({
      ...testInputWithHost,
      host_id: hostId
    });

    expect(result.name).toEqual('Web Application');
    expect(result.type).toEqual('application');
    expect(result.host_id).toEqual(hostId);
    expect(result.description).toEqual('A web application running on server');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent host_id', async () => {
    const invalidInput = {
      ...testInputWithHost,
      host_id: 999 // Non-existent hardware asset ID
    };

    await expect(createSoftwareAsset(invalidInput)).rejects.toThrow(/hardware asset with id 999 not found/i);
  });

  it('should handle all software types correctly', async () => {
    const softwareTypes = ['vm', 'container', 'service', 'application', 'other'] as const;

    for (const type of softwareTypes) {
      const input: CreateSoftwareAssetInput = {
        name: `Test ${type}`,
        type: type,
        host_id: null,
        description: `A test ${type} asset`
      };

      const result = await createSoftwareAsset(input);

      expect(result.type).toEqual(type);
      expect(result.name).toEqual(`Test ${type}`);
    }
  });

  it('should handle minimal required input', async () => {
    const minimalInput: CreateSoftwareAssetInput = {
      name: 'Minimal Asset',
      type: 'other',
      host_id: null,
      description: null
    };

    const result = await createSoftwareAsset(minimalInput);

    expect(result.name).toEqual('Minimal Asset');
    expect(result.type).toEqual('other');
    expect(result.host_id).toBeNull();
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should validate foreign key relationship with hardware asset', async () => {
    // Create hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Database Server',
        type: 'server',
        make: 'HP',
        model: 'ProLiant DL380',
        location: 'Datacenter B'
      })
      .returning()
      .execute();

    const hostId = hardwareResult[0].id;

    // Create software asset
    const result = await createSoftwareAsset({
      name: 'Database Service',
      type: 'service',
      host_id: hostId,
      description: 'PostgreSQL database service'
    });

    // Verify the relationship exists in database
    const assets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, result.id))
      .execute();

    expect(assets).toHaveLength(1);
    expect(assets[0].host_id).toEqual(hostId);

    // Verify the hardware asset still exists
    const hardwareAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, hostId))
      .execute();

    expect(hardwareAssets).toHaveLength(1);
    expect(hardwareAssets[0].name).toEqual('Database Server');
  });
});
