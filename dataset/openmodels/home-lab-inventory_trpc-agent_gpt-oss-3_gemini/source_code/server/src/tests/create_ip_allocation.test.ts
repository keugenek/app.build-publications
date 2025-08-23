import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { type CreateIPAllocationInput } from '../schema';
import { createIPAllocation } from '../handlers/create_ip_allocation';
import { eq } from 'drizzle-orm';

const testInput: CreateIPAllocationInput = {
  ip_address: '192.168.1.10',
  description: 'Test allocation',
  hardware_asset_id: null,
  software_asset_id: null,
};

describe('createIPAllocation', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP allocation with correct fields', async () => {
    const result = await createIPAllocation(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.ip_address).toBe(testInput.ip_address);
    expect(result.description).toBe(testInput.description);
    expect(result.hardware_asset_id).toBeNull();
    expect(result.software_asset_id).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should persist the allocation in the database', async () => {
    const result = await createIPAllocation(testInput);
    const rows = await db
      .select()
      .from(ipAllocationsTable)
      .where(eq(ipAllocationsTable.id, result.id))
      .execute();
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.ip_address).toBe(testInput.ip_address);
    expect(row.description).toBe(testInput.description);
    expect(row.hardware_asset_id).toBeNull();
    expect(row.software_asset_id).toBeNull();
    expect(row.created_at).toBeInstanceOf(Date);
  });
});
