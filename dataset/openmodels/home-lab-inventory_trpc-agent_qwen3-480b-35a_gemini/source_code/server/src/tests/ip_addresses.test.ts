import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ipAddressesTable, hardwareAssetsTable } from '../db/schema';
import { type CreateIPAddressInput, type UpdateIPAddressInput } from '../schema';
import { createIPAddress, getIPAddresses, getIPAddressById, updateIPAddress, deleteIPAddress } from '../handlers/ip_addresses';
import { eq } from 'drizzle-orm';

// Test data
const testHardwareAsset = {
  name: 'Test Server',
  type: 'Server' as const,
  make: 'TestMake',
  model: 'TestModel',
  serial_number: '123456789',
  description: 'Test hardware asset'
};

const testCreateInput: CreateIPAddressInput = {
  ip_address: '192.168.1.100',
  device_type: 'hardware',
  device_id: 1, // Will be updated with real ID after creating hardware asset
  description: 'Test IP allocation'
};

describe('IP Address Handlers', () => {
  beforeEach(async () => {
    await createDB();
    
    // Create a hardware asset for testing IP address association
    const hardwareResult = await db.insert(hardwareAssetsTable)
      .values(testHardwareAsset)
      .returning()
      .execute();
    
    // Update the device_id to match the created hardware asset
    testCreateInput.device_id = hardwareResult[0].id;
  });
  
  afterEach(resetDB);

  describe('createIPAddress', () => {
    it('should create a new IP address allocation', async () => {
      const result = await createIPAddress(testCreateInput);

      expect(result.ip_address).toEqual(testCreateInput.ip_address);
      expect(result.device_type).toEqual(testCreateInput.device_type);
      expect(result.device_id).toEqual(testCreateInput.device_id);
      expect(result.description).toEqual(testCreateInput.description);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should save IP address to database', async () => {
      const result = await createIPAddress(testCreateInput);

      const ipAddresses = await db.select()
        .from(ipAddressesTable)
        .where(eq(ipAddressesTable.id, result.id))
        .execute();

      expect(ipAddresses).toHaveLength(1);
      expect(ipAddresses[0].ip_address).toEqual(testCreateInput.ip_address);
      expect(ipAddresses[0].device_type).toEqual(testCreateInput.device_type);
      expect(ipAddresses[0].device_id).toEqual(testCreateInput.device_id);
      expect(ipAddresses[0].description).toEqual(testCreateInput.description);
      expect(ipAddresses[0].created_at).toBeInstanceOf(Date);
    });
  });

  describe('getIPAddresses', () => {
    it('should return all IP address allocations', async () => {
      // Create multiple IP addresses
      await createIPAddress(testCreateInput);
      
      const testCreateInput2: CreateIPAddressInput = {
        ip_address: '192.168.1.101',
        device_type: 'hardware',
        device_id: testCreateInput.device_id,
        description: 'Second IP allocation'
      };
      
      await createIPAddress(testCreateInput2);
      
      const results = await getIPAddresses();
      
      expect(results).toHaveLength(2);
      expect(results[0].ip_address).toEqual(testCreateInput.ip_address);
      expect(results[1].ip_address).toEqual(testCreateInput2.ip_address);
    });

    it('should return empty array when no IP addresses exist', async () => {
      const results = await getIPAddresses();
      expect(results).toHaveLength(0);
    });
  });

  describe('getIPAddressById', () => {
    it('should return a specific IP address by ID', async () => {
      const created = await createIPAddress(testCreateInput);
      const result = await getIPAddressById(created.id);
      
      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.ip_address).toEqual(testCreateInput.ip_address);
      expect(result!.device_type).toEqual(testCreateInput.device_type);
      expect(result!.device_id).toEqual(testCreateInput.device_id);
      expect(result!.description).toEqual(testCreateInput.description);
    });

    it('should return null for non-existent IP address ID', async () => {
      const result = await getIPAddressById(99999);
      expect(result).toBeNull();
    });
  });

  describe('updateIPAddress', () => {
    it('should update an existing IP address allocation', async () => {
      const created = await createIPAddress(testCreateInput);
      
      const updateInput: UpdateIPAddressInput = {
        id: created.id,
        ip_address: '10.0.0.1',
        device_type: 'software',
        device_id: 2,
        description: 'Updated description'
      };
      
      const result = await updateIPAddress(updateInput);
      
      expect(result.id).toEqual(created.id);
      expect(result.ip_address).toEqual(updateInput.ip_address!);
      expect(result.device_type).toEqual(updateInput.device_type!);
      expect(result.device_id).toEqual(updateInput.device_id!);
      expect(result.description).toEqual(updateInput.description!);
    });

    it('should partially update an existing IP address allocation', async () => {
      const created = await createIPAddress(testCreateInput);
      
      const updateInput: UpdateIPAddressInput = {
        id: created.id,
        description: 'Partially updated description'
      };
      
      const result = await updateIPAddress(updateInput);
      
      expect(result.id).toEqual(created.id);
      // Should keep original values for non-updated fields
      expect(result.ip_address).toEqual(testCreateInput.ip_address);
      expect(result.device_type).toEqual(testCreateInput.device_type);
      expect(result.device_id).toEqual(testCreateInput.device_id);
      // Should update the description
      expect(result.description).toEqual(updateInput.description!);
    });
  });

  describe('deleteIPAddress', () => {
    it('should delete an IP address allocation', async () => {
      const created = await createIPAddress(testCreateInput);
      const result = await deleteIPAddress(created.id);
      
      expect(result).toBe(true);
      
      // Verify it's deleted from database
      const ipAddresses = await db.select()
        .from(ipAddressesTable)
        .where(eq(ipAddressesTable.id, created.id))
        .execute();
      
      expect(ipAddresses).toHaveLength(0);
    });

    it('should return false when trying to delete non-existent IP address', async () => {
      const result = await deleteIPAddress(99999);
      expect(result).toBe(false);
    });
  });
});
