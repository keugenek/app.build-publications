import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { createDB, resetDB } from '../helpers';
import { db } from '../db';
import { ipAllocationsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import {
  type CreateIPAllocationInput,
  type UpdateIPAllocationInput,
} from '../schema';
import {
  createIPAllocation,
  getIPAllocations,
  updateIPAllocation,
  deleteIPAllocation,
} from '../handlers/ipAllocation';

const testInput: CreateIPAllocationInput = {
  ip_address: '192.168.1.10',
  allocation_target_type: 'hardware',
  allocation_target_id: 1,
  subnet: '192.168.1.0/24',
  status: 'allocated',
};

describe('IP Allocation Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an IP allocation', async () => {
    const result = await createIPAllocation(testInput);
    expect(result.id).toBeGreaterThan(0);
    expect(result.ip_address).toBe(testInput.ip_address);
    expect(result.allocation_target_type).toBe(testInput.allocation_target_type);
    expect(result.allocation_target_id).toBe(testInput.allocation_target_id);
    expect(result.subnet).toBe(testInput.subnet);
    expect(result.status).toBe(testInput.status);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should fetch all IP allocations', async () => {
    // create two allocations
    await createIPAllocation(testInput);
    const secondInput = { ...testInput, ip_address: '192.168.1.11' } as CreateIPAllocationInput;
    await createIPAllocation(secondInput);

    const all = await getIPAllocations();
    expect(all).toHaveLength(2);
    const ips = all.map(a => a.ip_address);
    expect(ips).toContain(testInput.ip_address);
    expect(ips).toContain(secondInput.ip_address);
  });

  it('should update an IP allocation', async () => {
    const created = await createIPAllocation(testInput);
    const update: UpdateIPAllocationInput = {
      id: created.id,
      status: 'available',
    };
    const updated = await updateIPAllocation(update);
    expect(updated.id).toBe(created.id);
    expect(updated.status).toBe('available');
    // unchanged fields remain same
    expect(updated.ip_address).toBe(created.ip_address);
  });

  it('should delete an IP allocation', async () => {
    const created = await createIPAllocation(testInput);
    const delResult = await deleteIPAllocation({ id: created.id });
    expect(delResult.success).toBe(true);
    // ensure it no longer exists
    const rows = await db.select().from(ipAllocationsTable).where(eq(ipAllocationsTable.id, created.id)).execute();
    expect(rows).toHaveLength(0);
  });
});
