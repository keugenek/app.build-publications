import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { getIpAddresses } from '../handlers/get_ip_addresses';
import { eq } from 'drizzle-orm';

describe('getIpAddresses', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no IP addresses exist', async () => {
    const result = await getIpAddresses();
    expect(result).toEqual([]);
  });

  it('should return all IP addresses when they exist', async () => {
    // First create a hardware asset to reference
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Test Server',
        type: 'server',
        description: 'A test server'
      })
      .returning()
      .execute();
    
    const hardwareAsset = hardwareResult[0];
    
    // Insert some test IP addresses
    const testIpAddresses = [
      {
        ip_address: '192.168.1.10',
        status: 'allocated' as const,
        hardware_asset_id: hardwareAsset.id,
        software_asset_id: null
      },
      {
        ip_address: '192.168.1.20',
        status: 'free' as const,
        hardware_asset_id: null,
        software_asset_id: null
      }
    ];

    for (const ipData of testIpAddresses) {
      await db.insert(ipAddressesTable)
        .values(ipData)
        .execute();
    }

    // Fetch all IP addresses
    const result = await getIpAddresses();

    // Validate the results
    expect(result).toHaveLength(2);
    
    // Check first IP address
    expect(result[0].ip_address).toEqual('192.168.1.10');
    expect(result[0].status).toEqual('allocated');
    expect(result[0].hardware_asset_id).toEqual(hardwareAsset.id);
    expect(result[0].software_asset_id).toBeNull();
    expect(result[0].created_at).toBeInstanceOf(Date);
    
    // Check second IP address
    expect(result[1].ip_address).toEqual('192.168.1.20');
    expect(result[1].status).toEqual('free');
    expect(result[1].hardware_asset_id).toBeNull();
    expect(result[1].software_asset_id).toBeNull();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should return IP addresses with software asset references', async () => {
    // Create a hardware asset first
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values({
        name: 'Host Server',
        type: 'server',
        description: 'Host for software assets'
      })
      .returning()
      .execute();
    
    const hardwareAsset = hardwareResult[0];
    
    // Create a software asset
    const softwareResult = await db.insert(softwareAssetsTable)
      .values({
        name: 'Test VM',
        type: 'VM',
        description: 'A test virtual machine',
        host_id: hardwareAsset.id
      })
      .returning()
      .execute();
    
    const softwareAsset = softwareResult[0];
    
    // Insert an IP address linked to the software asset
    await db.insert(ipAddressesTable)
      .values({
        ip_address: '10.0.0.5',
        status: 'allocated' as const,
        hardware_asset_id: null,
        software_asset_id: softwareAsset.id
      })
      .execute();

    // Fetch all IP addresses
    const result = await getIpAddresses();
    
    expect(result).toHaveLength(1);
    expect(result[0].ip_address).toEqual('10.0.0.5');
    expect(result[0].status).toEqual('allocated');
    expect(result[0].hardware_asset_id).toBeNull();
    expect(result[0].software_asset_id).toEqual(softwareAsset.id);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });
});
