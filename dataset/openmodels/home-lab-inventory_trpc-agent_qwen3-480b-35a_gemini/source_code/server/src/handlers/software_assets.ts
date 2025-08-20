import { db } from '../db';
import { softwareAssetsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { 
  type CreateSoftwareAssetInput, 
  type UpdateSoftwareAssetInput, 
  type SoftwareAsset 
} from '../schema';

export const createSoftwareAsset = async (input: CreateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    const result = await db.insert(softwareAssetsTable)
      .values({
        name: input.name,
        type: input.type,
        host_id: input.host_id,
        operating_system: input.operating_system,
        description: input.description
      })
      .returning()
      .execute();
    
    return result[0];
  } catch (error) {
    console.error('Software asset creation failed:', error);
    throw error;
  }
};

export const getSoftwareAssets = async (): Promise<SoftwareAsset[]> => {
  try {
    return await db.select().from(softwareAssetsTable).execute();
  } catch (error) {
    console.error('Fetching software assets failed:', error);
    throw error;
  }
};

export const getSoftwareAssetById = async (id: number): Promise<SoftwareAsset | null> => {
  try {
    const result = await db.select()
      .from(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, id))
      .execute();
    
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Fetching software asset by ID failed:', error);
    throw error;
  }
};

export const updateSoftwareAsset = async (input: UpdateSoftwareAssetInput): Promise<SoftwareAsset> => {
  try {
    const { id, ...updateData } = input;
    
    const result = await db.update(softwareAssetsTable)
      .set(updateData)
      .where(eq(softwareAssetsTable.id, id))
      .returning()
      .execute();
    
    if (result.length === 0) {
      throw new Error(`Software asset with id ${id} not found`);
    }
    
    return result[0];
  } catch (error) {
    console.error('Software asset update failed:', error);
    throw error;
  }
};

export const deleteSoftwareAsset = async (id: number): Promise<boolean> => {
  try {
    const result = await db.delete(softwareAssetsTable)
      .where(eq(softwareAssetsTable.id, id))
      .returning()
      .execute();
    
    // If no rows were returned, it means no record was deleted
    return result.length > 0;
  } catch (error) {
    console.error('Software asset deletion failed:', error);
    throw error;
  }
};
