import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteSoftwareAsset } from '../handlers/delete_software_asset';
import { eq } from 'drizzle-orm';

describe('deleteSoftwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a software asset successfully', async () => {
    // Create a hardware asset first
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'R740'
      })
      .returning()
      .execute();

    // Create a software asset
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'Test virtual machine',
        hardware_asset_id: hardwareAsset[0].id
      })
      .returning()
      .execute();

    const deleteInput: DeleteInput = {
      id: softwareAsset[0].id
    };

    const result = await deleteSoftwareAsset(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify the software asset was actually deleted
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset[0].id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent software asset', async () => {
    const deleteInput: DeleteInput = {
      id: 99999 // Non-existent ID
    };

    const result = await deleteSoftwareAsset(deleteInput);

    // Should return success: false when no record was found
    expect(result.success).toBe(false);
  });

  it('should handle cascade deletion for related IP addresses', async () => {
    // Create a hardware asset
    const hardwareAsset = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'R740'
      })
      .returning()
      .execute();

    // Create a software asset
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'Test virtual machine',
        hardware_asset_id: hardwareAsset[0].id
      })
      .returning()
      .execute();

    // Create IP addresses linked to the software asset
    const ipAddress1 = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        software_asset_id: softwareAsset[0].id,
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const ipAddress2 = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.101',
        subnet_mask: '255.255.255.0',
        software_asset_id: softwareAsset[0].id,
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const deleteInput: DeleteInput = {
      id: softwareAsset[0].id
    };

    const result = await deleteSoftwareAsset(deleteInput);

    // Verify success response
    expect(result.success).toBe(true);

    // Verify the software asset was deleted
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset[0].id))
      .execute();

    expect(deletedAssets).toHaveLength(0);

    // Verify IP addresses still exist but with software_asset_id set to null
    const updatedIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress1[0].id))
      .execute();

    expect(updatedIpAddresses).toHaveLength(1);
    expect(updatedIpAddresses[0].software_asset_id).toBeNull();

    const updatedIpAddresses2 = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress2[0].id))
      .execute();

    expect(updatedIpAddresses2).toHaveLength(1);
    expect(updatedIpAddresses2[0].software_asset_id).toBeNull();
  });

  it('should not affect IP addresses linked to other software assets', async () => {
    // Create two software assets
    const softwareAsset1 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 1',
        type: 'VM',
        description: 'First test VM'
      })
      .returning()
      .execute();

    const softwareAsset2 = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 2',
        type: 'VM',
        description: 'Second test VM'
      })
      .returning()
      .execute();

    // Create IP addresses for each software asset
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        software_asset_id: softwareAsset1[0].id,
        hardware_asset_id: null
      })
      .execute();

    const ipAddress2 = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.101',
        subnet_mask: '255.255.255.0',
        software_asset_id: softwareAsset2[0].id,
        hardware_asset_id: null
      })
      .returning()
      .execute();

    // Delete the first software asset
    const deleteInput: DeleteInput = {
      id: softwareAsset1[0].id
    };

    const result = await deleteSoftwareAsset(deleteInput);

    expect(result.success).toBe(true);

    // Verify the second software asset's IP address is unaffected
    const unaffectedIpAddress = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddress2[0].id))
      .execute();

    expect(unaffectedIpAddress).toHaveLength(1);
    expect(unaffectedIpAddress[0].software_asset_id).toBe(softwareAsset2[0].id);
  });

  it('should delete software asset without hardware association', async () => {
    // Create a software asset without hardware association
    const softwareAsset = await db.insert(softwareAssetsTable)
      .values({
        name: 'Standalone Service',
        type: 'Service',
        description: 'A standalone service',
        hardware_asset_id: null
      })
      .returning()
      .execute();

    const deleteInput: DeleteInput = {
      id: softwareAsset[0].id
    };

    const result = await deleteSoftwareAsset(deleteInput);

    expect(result.success).toBe(true);

    // Verify the software asset was deleted
    const deletedAssets = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, softwareAsset[0].id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });
});
