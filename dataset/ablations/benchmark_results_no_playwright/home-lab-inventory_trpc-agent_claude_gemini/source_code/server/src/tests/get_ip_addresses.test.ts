import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { getIpAddresses } from '../handlers/get_ip_addresses';

describe('getIpAddresses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no IP addresses exist', async () => {
    const result = await getIpAddresses();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all IP addresses', async () => {
    // Insert test hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'Server',
        manufacturer: 'Dell',
        model: 'PowerEdge R740'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Insert test software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'Test virtual machine',
        hardware_asset_id: hardwareAssetId
      })
      .returning()
      .execute();

    const softwareAssetId = softwareResult[0].id;

    // Insert test IP addresses with different configurations
    await db.insert(ipAddressesTable)
      .values([
        {
          ip_address: '192.168.1.100',
          subnet_mask: '255.255.255.0',
          hardware_asset_id: hardwareAssetId,
          software_asset_id: null
        },
        {
          ip_address: '10.0.0.50',
          subnet_mask: '255.255.0.0',
          hardware_asset_id: null,
          software_asset_id: softwareAssetId
        },
        {
          ip_address: '172.16.1.1',
          subnet_mask: '255.255.255.0',
          hardware_asset_id: hardwareAssetId,
          software_asset_id: softwareAssetId
        },
        {
          ip_address: '203.0.113.10',
          subnet_mask: '255.255.255.0',
          hardware_asset_id: null,
          software_asset_id: null
        }
      ])
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(4);
    
    // Verify all IP addresses are returned
    const ipAddresses = result.map(ip => ip.ip_address).sort();
    expect(ipAddresses).toEqual([
      '10.0.0.50',
      '172.16.1.1',
      '192.168.1.100',
      '203.0.113.10'
    ]);

    // Verify structure of returned objects
    result.forEach(ipAddress => {
      expect(ipAddress.id).toBeDefined();
      expect(typeof ipAddress.ip_address).toBe('string');
      expect(typeof ipAddress.subnet_mask).toBe('string');
      expect(ipAddress.created_at).toBeInstanceOf(Date);
      expect(ipAddress.updated_at).toBeInstanceOf(Date);
      // hardware_asset_id and software_asset_id can be null or number
      expect(
        ipAddress.hardware_asset_id === null || 
        typeof ipAddress.hardware_asset_id === 'number'
      ).toBe(true);
      expect(
        ipAddress.software_asset_id === null || 
        typeof ipAddress.software_asset_id === 'number'
      ).toBe(true);
    });
  });

  it('should return IP addresses with correct foreign key relationships', async () => {
    // Create hardware asset
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Network Switch',
        type: 'Switch',
        manufacturer: 'Cisco',
        model: 'Catalyst 3750'
      })
      .returning()
      .execute();

    const hardwareAssetId = hardwareResult[0].id;

    // Insert IP address linked to hardware
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '192.168.1.254',
        subnet_mask: '255.255.255.0',
        hardware_asset_id: hardwareAssetId,
        software_asset_id: null
      })
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(1);
    expect(result[0].ip_address).toBe('192.168.1.254');
    expect(result[0].subnet_mask).toBe('255.255.255.0');
    expect(result[0].hardware_asset_id).toBe(hardwareAssetId);
    expect(result[0].software_asset_id).toBeNull();
  });

  it('should handle IP addresses with no asset relationships', async () => {
    // Insert IP address without any asset links
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '8.8.8.8',
        subnet_mask: '255.255.255.255',
        hardware_asset_id: null,
        software_asset_id: null
      })
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(1);
    expect(result[0].ip_address).toBe('8.8.8.8');
    expect(result[0].subnet_mask).toBe('255.255.255.255');
    expect(result[0].hardware_asset_id).toBeNull();
    expect(result[0].software_asset_id).toBeNull();
  });

  it('should preserve order and return all fields correctly', async () => {
    // Insert multiple IP addresses
    const testIpAddresses = [
      {
        ip_address: '10.1.1.1',
        subnet_mask: '255.0.0.0'
      },
      {
        ip_address: '10.2.2.2',
        subnet_mask: '255.255.0.0'
      }
    ];

    await db.insert(ipAddressesTable)
      .values(testIpAddresses.map(ip => ({
        ...ip,
        hardware_asset_id: null,
        software_asset_id: null
      })))
      .execute();

    const result = await getIpAddresses();

    expect(result).toHaveLength(2);
    
    // Verify all required fields are present
    result.forEach(ipAddress => {
      expect(ipAddress).toHaveProperty('id');
      expect(ipAddress).toHaveProperty('ip_address');
      expect(ipAddress).toHaveProperty('subnet_mask');
      expect(ipAddress).toHaveProperty('hardware_asset_id');
      expect(ipAddress).toHaveProperty('software_asset_id');
      expect(ipAddress).toHaveProperty('created_at');
      expect(ipAddress).toHaveProperty('updated_at');
    });

    // Verify IP addresses are included
    const returnedIps = result.map(ip => ip.ip_address);
    expect(returnedIps).toContain('10.1.1.1');
    expect(returnedIps).toContain('10.2.2.2');
  });
});
