import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteHardwareAsset } from '../handlers/delete_hardware_asset';
import { eq } from 'drizzle-orm';

// Test input
const testDeleteInput: DeleteInput = {
  id: 1
};

describe('deleteHardwareAsset', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a hardware asset successfully', async () => {
    // Create test hardware asset
    const [createdAsset] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    const result = await deleteHardwareAsset({ id: createdAsset.id });

    expect(result.success).toBe(true);

    // Verify hardware asset is deleted
    const deletedAssets = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdAsset.id))
      .execute();

    expect(deletedAssets).toHaveLength(0);
  });

  it('should throw error when hardware asset does not exist', async () => {
    expect(deleteHardwareAsset({ id: 999 })).rejects.toThrow(/Hardware asset with ID 999 not found/);
  });

  it('should cascade delete related software assets', async () => {
    // Create test hardware asset
    const [createdHardware] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    // Create related software assets
    const [createdSoftware1] = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 1',
        type: 'VM',
        description: 'Test VM for deletion',
        hardware_asset_id: createdHardware.id
      })
      .returning()
      .execute();

    const [createdSoftware2] = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 2',
        type: 'VM',
        description: 'Another test VM for deletion',
        hardware_asset_id: createdHardware.id
      })
      .returning()
      .execute();

    const result = await deleteHardwareAsset({ id: createdHardware.id });

    expect(result.success).toBe(true);

    // Verify hardware asset is deleted
    const deletedHardware = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdHardware.id))
      .execute();

    expect(deletedHardware).toHaveLength(0);

    // Verify software assets are deleted
    const deletedSoftware = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.hardware_asset_id, createdHardware.id))
      .execute();

    expect(deletedSoftware).toHaveLength(0);
  });

  it('should cascade delete related IP addresses', async () => {
    // Create test hardware asset
    const [createdHardware] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    // Create related IP addresses
    const [createdIp1] = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: createdHardware.id,
        software_asset_id: null
      })
      .returning()
      .execute();

    const [createdIp2] = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.101',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: createdHardware.id,
        software_asset_id: null
      })
      .returning()
      .execute();

    const result = await deleteHardwareAsset({ id: createdHardware.id });

    expect(result.success).toBe(true);

    // Verify hardware asset is deleted
    const deletedHardware = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdHardware.id))
      .execute();

    expect(deletedHardware).toHaveLength(0);

    // Verify IP addresses are deleted
    const deletedIps = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.hardware_asset_id, createdHardware.id))
      .execute();

    expect(deletedIps).toHaveLength(0);
  });

  it('should cascade delete complex relationships (hardware -> software -> IPs)', async () => {
    // Create test hardware asset
    const [createdHardware] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    // Create related software asset
    const [createdSoftware] = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'Test VM for deletion',
        hardware_asset_id: createdHardware.id
      })
      .returning()
      .execute();

    // Create IP address linked to hardware
    const [createdHardwareIp] = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: createdHardware.id,
        software_asset_id: null
      })
      .returning()
      .execute();

    // Create IP address linked to software
    const [createdSoftwareIp] = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.101',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: null,
        software_asset_id: createdSoftware.id
      })
      .returning()
      .execute();

    const result = await deleteHardwareAsset({ id: createdHardware.id });

    expect(result.success).toBe(true);

    // Verify hardware asset is deleted
    const deletedHardware = await db.select()
      .from(hardwareAssetsTable)
      .where(eq(hardwareAssetsTable.id, createdHardware.id))
      .execute();

    expect(deletedHardware).toHaveLength(0);

    // Verify software asset is deleted
    const deletedSoftware = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, createdSoftware.id))
      .execute();

    expect(deletedSoftware).toHaveLength(0);

    // Verify all IP addresses are deleted
    const allIps = await db.select()
      .from(ipAddressesTable)
      .execute();

    expect(allIps).toHaveLength(0);
  });

  it('should not delete unrelated software assets or IP addresses', async () => {
    // Create test hardware assets
    const [createdHardware1] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 1',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R750',
        description: 'Test server for deletion'
      })
      .returning()
      .execute();

    const [createdHardware2] = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server 2',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380',
        description: 'Test server to keep'
      })
      .returning()
      .execute();

    // Create software assets - one for each hardware
    const [createdSoftware1] = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 1',
        type: 'VM',
        description: 'VM to be deleted',
        hardware_asset_id: createdHardware1.id
      })
      .returning()
      .execute();

    const [createdSoftware2] = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM 2',
        type: 'VM',
        description: 'VM to keep',
        hardware_asset_id: createdHardware2.id
      })
      .returning()
      .execute();

    // Create IP addresses - one for each hardware
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: createdHardware1.id,
        software_asset_id: null
      })
      .execute();

    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.101',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: createdHardware2.id,
        software_asset_id: null
      })
      .execute();

    // Delete hardware1
    const result = await deleteHardwareAsset({ id: createdHardware1.id });

    expect(result.success).toBe(true);

    // Verify hardware1 is deleted but hardware2 remains
    const remainingHardware = await db.select()
      .from(hardwareAssetsTable)
      .execute();

    expect(remainingHardware).toHaveLength(1);
    expect(remainingHardware[0].id).toEqual(createdHardware2.id);

    // Verify software1 is deleted but software2 remains
    const remainingSoftware = await db.select()
      .from(softwareAssetsTable)
      .execute();

    expect(remainingSoftware).toHaveLength(1);
    expect(remainingSoftware[0].id).toEqual(createdSoftware2.id);

    // Verify IP1 is deleted but IP2 remains
    const remainingIps = await db.select()
      .from(ipAddressesTable)
      .execute();

    expect(remainingIps).toHaveLength(1);
    expect(remainingIps[0].hardware_asset_id).toEqual(createdHardware2.id);
  });
});
