import { db } from '../db';
import { ipAllocationsTable, hardwareAssetsTable, softwareAssetsTable } from '../db/schema';
import { type CreateIpAllocationInput, type IpAllocation } from '../schema';
import { eq } from 'drizzle-orm';

export const createIpAllocation = async (input: CreateIpAllocationInput): Promise<IpAllocation> => {
  try {
    // Validate that hardware_asset_id exists if provided
    if (input.hardware_asset_id !== null) {
      const hardwareAsset = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.hardware_asset_id))
        .execute();
      
      if (hardwareAsset.length === 0) {
        throw new Error(`Hardware asset with id ${input.hardware_asset_id} does not exist`);
      }
    }

    // Validate that software_asset_id exists if provided
    if (input.software_asset_id !== null) {
      const softwareAsset = await db.select()
        .from(softwareAssetsTable)
        .where(eq(softwareAssetsTable.id, input.software_asset_id))
        .execute();
      
      if (softwareAsset.length === 0) {
        throw new Error(`Software asset with id ${input.software_asset_id} does not exist`);
      }
    }

    // Insert IP allocation record
    const result = await db.insert(ipAllocationsTable)
      .values({
        ip_address: input.ip_address,
        asset_name: input.asset_name,
        hardware_asset_id: input.hardware_asset_id,
        software_asset_id: input.software_asset_id,
        description: input.description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('IP allocation creation failed:', error);
    throw error;
  }
};
