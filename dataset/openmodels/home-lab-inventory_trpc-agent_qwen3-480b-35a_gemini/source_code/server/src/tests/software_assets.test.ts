import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateSoftwareAssetInput, 
  type UpdateSoftwareAssetInput 
} from '../schema';
import { 
  createSoftwareAsset, 
  getSoftwareAssets, 
  getSoftwareAssetById, 
  updateSoftwareAsset, 
  deleteSoftwareAsset 
} from '../handlers/software_assets';

// Test data
const testCreateInput: CreateSoftwareAssetInput = {
  name: 'Test VM',
  type: 'VM',
  host_id: 1,
  operating_system: 'Ubuntu 20.04',
  description: 'A test virtual machine'
};

const testUpdateInput: UpdateSoftwareAssetInput = {
  id: 1,
  name: 'Updated VM',
  type: 'Container',
  host_id: 2,
  operating_system: 'Ubuntu 22.04',
  description: 'An updated container'
};

describe('softwareAssets handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createSoftwareAsset', () => {
    it('should create a software asset', async () => {
      const result = await createSoftwareAsset(testCreateInput);

      // Basic field validation
      expect(result.name).toEqual('Test VM');
      expect(result.type).toEqual('VM');
      expect(result.host_id).toEqual(1);
      expect(result.operating_system).toEqual('Ubuntu 20.04');
      expect(result.description).toEqual('A test virtual machine');
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save software asset to database', async () => {
      const result = await createSoftwareAsset(testCreateInput);

      // Query using proper drizzle syntax
      const assets = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, result.id))
        .execute();

      expect(assets).toHaveLength(1);
      expect(assets[0].name).toEqual('Test VM');
      expect(assets[0].type).toEqual('VM');
      expect(assets[0].host_id).toEqual(1);
      expect(assets[0].operating_system).toEqual('Ubuntu 20.04');
      expect(assets[0].description).toEqual('A test virtual machine');
      expect(assets[0].created_at).toBeInstanceOf(Date);
    });
  });

  describe('getSoftwareAssets', () => {
    it('should return all software assets', async () => {
      // Create test data
      await createSoftwareAsset(testCreateInput);
      await createSoftwareAsset({
        ...testCreateInput,
        name: 'Test Container',
        type: 'Container',
        operating_system: 'Alpine Linux'
      });

      const results = await getSoftwareAssets();

      expect(results).toHaveLength(2);
      expect(results[0].name).toEqual('Test VM');
      expect(results[1].name).toEqual('Test Container');
    });

    it('should return empty array when no software assets exist', async () => {
      const results = await getSoftwareAssets();
      expect(results).toEqual([]);
    });
  });

  describe('getSoftwareAssetById', () => {
    it('should return a software asset by ID', async () => {
      const created = await createSoftwareAsset(testCreateInput);
      const result = await getSoftwareAssetById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.name).toEqual('Test VM');
    });

    it('should return null for non-existent software asset', async () => {
      const result = await getSoftwareAssetById(999);
      expect(result).toBeNull();
    });
  });

  describe('updateSoftwareAsset', () => {
    it('should update a software asset', async () => {
      const created = await createSoftwareAsset(testCreateInput);
      
      const result = await updateSoftwareAsset({
        id: created.id,
        name: 'Updated VM',
        type: 'Container',
        host_id: 2,
        operating_system: 'Ubuntu 22.04',
        description: 'An updated container'
      });

      expect(result.id).toEqual(created.id);
      expect(result.name).toEqual('Updated VM');
      expect(result.type).toEqual('Container');
      expect(result.host_id).toEqual(2);
      expect(result.operating_system).toEqual('Ubuntu 22.04');
      expect(result.description).toEqual('An updated container');
    });

    it('should save updated software asset to database', async () => {
      const created = await createSoftwareAsset(testCreateInput);
      
      await updateSoftwareAsset({
        id: created.id,
        name: 'Updated VM',
        type: 'Container',
        host_id: 2,
        operating_system: 'Ubuntu 22.04',
        description: 'An updated container'
      });

      // Query using proper drizzle syntax
      const assets = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, created.id))
        .execute();

      expect(assets).toHaveLength(1);
      expect(assets[0].name).toEqual('Updated VM');
      expect(assets[0].type).toEqual('Container');
      expect(assets[0].host_id).toEqual(2);
      expect(assets[0].operating_system).toEqual('Ubuntu 22.04');
      expect(assets[0].description).toEqual('An updated container');
    });

    it('should throw error for non-existent software asset', async () => {
      await expect(updateSoftwareAsset({
        id: 999,
        name: 'Non-existent'
      })).rejects.toThrow(/Software asset with id 999 not found/i);
    });
  });

  describe('deleteSoftwareAsset', () => {
    it('should delete a software asset', async () => {
      const created = await createSoftwareAsset(testCreateInput);
      const result = await deleteSoftwareAsset(created.id);

      expect(result).toBe(true);

      // Verify it's deleted from database
      const assets = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, created.id))
        .execute();

      expect(assets).toHaveLength(0);
    });

    it('should return false for non-existent software asset', async () => {
      const result = await deleteSoftwareAsset(999);
      expect(result).toBe(false);
    });
  });
});
