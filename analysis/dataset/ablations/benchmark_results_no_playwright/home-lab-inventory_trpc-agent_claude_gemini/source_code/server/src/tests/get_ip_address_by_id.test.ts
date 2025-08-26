import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type GetByIdInput } from '../schema';
import { getIpAddressById } from '../handlers/get_ip_address_by_id';

describe('getIpAddressById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an IP address by ID', async () => {
    // Create test IP address
    const insertResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.100',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .returning()
      .execute();

    const createdIpAddress = insertResult[0];
    const input: GetByIdInput = { id: createdIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIpAddress.id);
    expect(result!.ip_address).toEqual('192.168.1.100');
    expect(result!.subnet_mask).toEqual('255.255.255.0');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return an IP address linked to hardware asset', async () => {
    // Create hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740',
        description: 'Test server for IP assignment'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create IP address linked to hardware asset
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.0.1.50',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: null
      })
      .returning()
      .execute();

    const createdIpAddress = ipResult[0];
    const input: GetByIdInput = { id: createdIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIpAddress.id);
    expect(result!.ip_address).toEqual('10.0.1.50');
    expect(result!.subnet_mask).toEqual('255.255.255.0');
    expect(result!.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(result!.software_asset_id).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return an IP address linked to software asset', async () => {
    // Create hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'Server',
        manufacturer: 'HP',
        model: 'ProLiant DL380',
        description: 'Host server for VMs'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset linked to hardware
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Web Server VM',
        type: 'VM',
        description: 'Virtual machine for web services',
        hardware_asset_id: hardwareAsset.id
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP address linked to software asset
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '172.16.0.25',
        subnet_mask: '255.255.0.0',
        hardware_asset_id: null,
        software_asset_id: softwareAsset.id
      })
      .returning()
      .execute();

    const createdIpAddress = ipResult[0];
    const input: GetByIdInput = { id: createdIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIpAddress.id);
    expect(result!.ip_address).toEqual('172.16.0.25');
    expect(result!.subnet_mask).toEqual('255.255.0.0');
    expect(result!.hardware_asset_id).toBeNull();
    expect(result!.software_asset_id).toEqual(softwareAsset.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return an IP address linked to both hardware and software assets', async () => {
    // Create hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Network Switch',
        type: 'Switch',
        manufacturer: 'Cisco',
        model: 'Catalyst 9300',
        description: 'Core network switch'
      })
      .returning()
      .execute();

    const hardwareAsset = hardwareResult[0];

    // Create software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Management Service',
        type: 'Service',
        description: 'Network management service',
        hardware_asset_id: hardwareAsset.id
      })
      .returning()
      .execute();

    const softwareAsset = softwareResult[0];

    // Create IP address linked to both assets
    const ipResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.100.1',
        subnet_mask: '255.255.255.252',
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: softwareAsset.id
      })
      .returning()
      .execute();

    const createdIpAddress = ipResult[0];
    const input: GetByIdInput = { id: createdIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdIpAddress.id);
    expect(result!.ip_address).toEqual('192.168.100.1');
    expect(result!.subnet_mask).toEqual('255.255.255.252');
    expect(result!.hardware_asset_id).toEqual(hardwareAsset.id);
    expect(result!.software_asset_id).toEqual(softwareAsset.id);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when IP address does not exist', async () => {
    const input: GetByIdInput = { id: 99999 };

    const result = await getIpAddressById(input);

    expect(result).toBeNull();
  });

  it('should handle database query correctly', async () => {
    // Create multiple IP addresses to ensure we get the right one
    const ip1Result = await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.1.1.1',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .returning()
      .execute();

    const ip2Result = await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.1.1.2',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .returning()
      .execute();

    const targetIpAddress = ip2Result[0];
    const input: GetByIdInput = { id: targetIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(targetIpAddress.id);
    expect(result!.ip_address).toEqual('10.1.1.2');
    
    // Verify we didn't get the wrong IP
    expect(result!.ip_address).not.toEqual('10.1.1.1');
  });

  it('should preserve all timestamp fields correctly', async () => {
    const beforeInsert = new Date();
    
    const insertResult = await db.insert(ipAddressesTable)
      .values({
        ip_address: '203.0.113.42',
        subnet_mask: '255.255.255.240',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .returning()
      .execute();

    const afterInsert = new Date();
    const createdIpAddress = insertResult[0];
    const input: GetByIdInput = { id: createdIpAddress.id };

    const result = await getIpAddressById(input);

    expect(result).not.toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.created_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(result!.created_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
    expect(result!.updated_at.getTime()).toBeGreaterThanOrEqual(beforeInsert.getTime());
    expect(result!.updated_at.getTime()).toBeLessThanOrEqual(afterInsert.getTime());
  });
});
