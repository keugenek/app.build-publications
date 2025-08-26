import { db } from '../db';
import { softwareAssetsTable, hardwareAssetsTable } from '../db/schema';
import { type CreateSoftwareAssetInput, type SoftwareAsset } from '../schema';
import { eq } from 'drizzle-orm';

export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    // If host_hardware_id is provided, verify the hardware asset exists
    if (input.host_hardware_id) {
      const hostHardware = await db.select()
        .from(hardwareAssetsTable)
        .where(eq(hardwareAssetsTable.id, input.host_hardware_id))
        .execute();
      
      if (hostHardware.length === 0) {
        throw new Error(`Hardware asset with ID ${input.host_hardware_id} not found`);
      }
    }

    // Insert software asset record
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        status: input.status, // Zod has already applied the default value 'stopped'
        host_hardware_id: input.host_hardware_id || null,
        operating_system: input.operating_system || null,
        version: input.version || null,
        notes: input.notes || null
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};
