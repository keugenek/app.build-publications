import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { resetDB, createDB } from '../helpers';
import { getIPAllocations } from '../handlers/get_ip_allocations';

describe('getIPAllocations handler', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return an empty array when no allocations exist', async () => {
    const result = await getIPAllocations();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it('should fetch all IP allocations from the database', async () => {
    // Insert a test allocation
    const inserted = await db
      .insert(ipAllocationsTable)
      .values({
        ip_address: '10.0.0.1',
        description: 'Test allocation',
        hardware_asset_id: null,
        software_asset_id: null,
      })
      .returning()
      .execute();

    // Ensure insertion succeeded
    expect(inserted).toHaveLength(1);
    const insertedRow = inserted[0];

    const result = await getIPAllocations();
    expect(result).toHaveLength(1);
    const allocation = result[0];

    // Verify fields match inserted data
    expect(allocation.id).toBe(insertedRow.id);
    expect(allocation.ip_address).toBe('10.0.0.1');
    expect(allocation.description).toBe('Test allocation');
    expect(allocation.hardware_asset_id).toBeNull();
    expect(allocation.software_asset_id).toBeNull();
    expect(allocation.created_at).toBeInstanceOf(Date);
  });
});
