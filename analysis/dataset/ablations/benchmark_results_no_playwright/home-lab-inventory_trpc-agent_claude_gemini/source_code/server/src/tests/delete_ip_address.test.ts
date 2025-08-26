import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { hardwareAssetsTable, softwareAssetsTable, ipAddressesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { deleteIpAddress } from '../handlers/delete_ip_address';
import { eq } from 'drizzle-orm';

describe('deleteIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing IP address', async () => {
    // Create a hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R630'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Create an IP address
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: hardwareAssetId
      })
      .returning()
      .execute();

    const ipAddressId = ipResult[0].id;

    // Delete the IP address
    const deleteInput: DeleteInput = { id: ipAddressId };
    const result = await deleteIpAddress(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the IP address no longer exists in the database
    const remainingIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddressId))
      .execute();

    expect(remainingIpAddresses).toHaveLength(0);
  });

  it('should delete IP address linked to software asset', async () => {
    // Create hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380'
      })
      .returning()
      .execute();

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web Server VM',
        type: 'VM',
        description: 'Virtual machine for web services',
        hardware_asset_id: hardwareResult[0].id
      })
      .returning()
      .execute();

    // Create IP address linked to software asset
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.0.1.50',
        subnet_mask: '255.255.0.0',
        software_asset_id: softwareResult[0].id
      })
      .returning()
      .execute();

    const ipAddressId = ipResult[0].id;

    // Delete the IP address
    const deleteInput: DeleteInput = { id: ipAddressId };
    const result = await deleteIpAddress(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the IP address no longer exists
    const remainingIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddressId))
      .execute();

    expect(remainingIpAddresses).toHaveLength(0);
  });

  it('should return success false for non-existent IP address', async () => {
    const deleteInput: DeleteInput = { id: 999999 }; // Non-existent ID
    const result = await deleteIpAddress(deleteInput);

    // Should return false since no record was deleted
    expect(result.success).toBe(false);
  });

  it('should delete IP address with both hardware and software associations', async () => {
    // Create hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Multi-use Server',
        type: 'Server',
        manufacturer: 'Cisco',
        model: 'UCS C240'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Database Container',
        type: 'Container',
        hardware_asset_id: hardwareAssetId
      })
      .returning()
      .execute();

    const softwareAssetId = softwareResult[0].id;

    // Create IP address with both hardware and software associations
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '172.16.0.25',
        subnet_mask: '255.255.0.0',
        hardware_asset_id: hardwareAssetId,
        software_asset_id: softwareAssetId
      })
      .returning()
      .execute();

    const ipAddressId = ipResult[0].id;

    // Delete the IP address
    const deleteInput: DeleteInput = { id: ipAddressId };
    const result = await deleteIpAddress(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the record is completely removed
    const remainingIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddressId))
      .execute();

    expect(remainingIpAddresses).toHaveLength(0);
  });

  it('should delete standalone IP address with no asset associations', async () => {
    // Create IP address without any asset associations
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '203.0.113.42',
        subnet_mask: '255.255.255.248',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .returning()
      .execute();

    const ipAddressId = ipResult[0].id;

    // Delete the IP address
    const deleteInput: DeleteInput = { id: ipAddressId };
    const result = await deleteIpAddress(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify the record is gone
    const remainingIpAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, ipAddressId))
      .execute();

    expect(remainingIpAddresses).toHaveLength(0);
  });

  it('should not affect other IP addresses when deleting one', async () => {
    // Create multiple IP addresses
    const ipResults = await db.insert(ipAddressesTable)
      .values([
        {
          ip_address: '192.168.1.10',
          subnet_mask: '255.255.255.0'
        },
        {
          ip_address: '192.168.1.20',
          subnet_mask: '255.255.255.0'
        },
        {
          ip_address: '192.168.1.30',
          subnet_mask: '255.255.255.0'
        }
      ])
      .returning()
      .execute();

    const targetId = ipResults[1].id; // Delete the middle one

    // Delete one IP address
    const deleteInput: DeleteInput = { id: targetId };
    const result = await deleteIpAddress(deleteInput);

    // Verify successful deletion
    expect(result.success).toBe(true);

    // Verify only the target was deleted
    const remainingIpAddresses = await db.select()
      .from(ipAddressesTable)
      .execute();

    expect(remainingIpAddresses).toHaveLength(2);
    expect(remainingIpAddresses.some(ip => ip.id === targetId)).toBe(false);
    expect(remainingIpAddresses.some(ip => ip.ip_address === '192.168.1.10')).toBe(true);
    expect(remainingIpAddresses.some(ip => ip.ip_address === '192.168.1.30')).toBe(true);
  });
});
