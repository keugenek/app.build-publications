import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAddressInput } from '../schema';
import { createIpAddress } from '../handlers/create_ip_address';
import { eq } from 'drizzle-orm';

describe('createIpAddress', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create IP address linked to hardware asset', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740',
        description: 'Test server for IP allocation'
      })
      .returning()
      .execute();

    const testInput: CreateIpAddressInput = {
      ip_address: '192.168.1.100',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: null
    };

    const result = await createIpAddress(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('192.168.1.100');
    expect(result.subnet_mask).toEqual('255.255.255.0');
    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create IP address linked to software asset', async () => {
    // Create prerequisite hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380',
        description: 'Host for VM'
      })
      .returning()
      .execute();

    // Create prerequisite software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web VM',
        type: 'VM',
        description: 'Web server VM',
        hardware_asset_id: hardwareResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateIpAddressInput = {
      ip_address: '10.0.1.50',
      subnet_mask: '255.255.0.0',
      hardware_asset_id: null,
      software_asset_id: softwareResult[0].id
    };

    const result = await createIpAddress(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('10.0.1.50');
    expect(result.subnet_mask).toEqual('255.255.0.0');
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toEqual(softwareResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create IP address linked to both hardware and software assets', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Network Switch',
        type: 'Switch',
        manufacturer: 'Cisco',
        model: 'Catalyst 2960',
        description: 'Core network switch'
      })
      .returning()
      .execute();

    // Create prerequisite software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Management Service',
        type: 'Service',
        description: 'Switch management service',
        hardware_asset_id: hardwareResult[0].id
      })
      .returning()
      .execute();

    const testInput: CreateIpAddressInput = {
      ip_address: '172.16.0.1',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: softwareResult[0].id
    };

    const result = await createIpAddress(testInput);

    // Basic field validation
    expect(result.ip_address).toEqual('172.16.0.1');
    expect(result.subnet_mask).toEqual('255.255.255.0');
    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(result.software_asset_id).toEqual(softwareResult[0].id);
    expect(result.id).toBeDefined();
  });

  it('should save IP address to database', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Database Server',
        type: 'Server',
        manufacturer: 'IBM',
        model: 'System x3650',
        description: 'Database server'
      })
      .returning()
      .execute();

    const testInput: CreateIpAddressInput = {
      ip_address: '192.168.10.200',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: null
    };

    const result = await createIpAddress(testInput);

    // Query database to verify IP address was saved
    const ipAddresses = await db.select()
      .from(ipAddressesTable)
      .where(eq(ipAddressesTable.id, result.id))
      .execute();

    expect(ipAddresses).toHaveLength(1);
    expect(ipAddresses[0].ip_address).toEqual('192.168.10.200');
    expect(ipAddresses[0].subnet_mask).toEqual('255.255.255.0');
    expect(ipAddresses[0].hardware_asset_id).toEqual(hardwareResult[0].id);
    expect(ipAddresses[0].software_asset_id).toBeNull();
    expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
    expect(ipAddresses[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when neither hardware_asset_id nor software_asset_id is provided', async () => {
    const testInput: CreateIpAddressInput = {
      ip_address: '192.168.1.1',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: null,
      software_asset_id: null
    };

    await expect(createIpAddress(testInput)).rejects.toThrow(/Either hardware_asset_id or software_asset_id must be provided/i);
  });

  it('should throw error when hardware_asset_id does not exist', async () => {
    const testInput: CreateIpAddressInput = {
      ip_address: '192.168.1.1',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: 9999, // Non-existent ID
      software_asset_id: null
    };

    await expect(createIpAddress(testInput)).rejects.toThrow(/Hardware asset with id 9999 not found/i);
  });

  it('should throw error when software_asset_id does not exist', async () => {
    const testInput: CreateIpAddressInput = {
      ip_address: '192.168.1.1',
      subnet_mask: '255.255.255.0',
      hardware_asset_id: null,
      software_asset_id: 9999 // Non-existent ID
    };

    await expect(createIpAddress(testInput)).rejects.toThrow(/Software asset with id 9999 not found/i);
  });

  it('should handle IPv6 addresses correctly', async () => {
    // Create prerequisite hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'IPv6 Router',
        type: 'Router',
        manufacturer: 'Juniper',
        model: 'MX480',
        description: 'IPv6 enabled router'
      })
      .returning()
      .execute();

    const testInput: CreateIpAddressInput = {
      ip_address: '2001:db8::1',
      subnet_mask: 'ffff:ffff:ffff:ffff::',
      hardware_asset_id: hardwareResult[0].id,
      software_asset_id: null
    };

    const result = await createIpAddress(testInput);

    expect(result.ip_address).toEqual('2001:db8::1');
    expect(result.subnet_mask).toEqual('ffff:ffff:ffff:ffff::');
    expect(result.hardware_asset_id).toEqual(hardwareResult[0].id);
  });
});
