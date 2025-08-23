import { db } from '../db';
import { catsTable, behaviorsTable } from '../db/schema';
import { type ConspiracyLevel, type GetConspiracyLevelsInput } from '../schema';
import { and, desc, eq, gte, lt, sql } from 'drizzle-orm';

export const getConspiracyLevels = async (input?: GetConspiracyLevelsInput): Promise<ConspiracyLevel[]> => {
  try {
    // Build conditions
    const conditions = [];
    
    // Filter by specific cat if provided
    if (input?.cat_id !== undefined) {
      conditions.push(eq(catsTable.id, input.cat_id));
    }

    // Filter by date range if provided
    if (input?.date !== undefined) {
      const startDate = new Date(input.date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      conditions.push(gte(behaviorsTable.recorded_at, startDate));
      conditions.push(lt(behaviorsTable.recorded_at, endDate));
    }

    // Build the main query with all clauses at once
    const results = await db.select({
      cat_id: catsTable.id,
      cat_name: catsTable.name,
      total_behaviors: sql<number>`count(${behaviorsTable.id})`.as('total_behaviors'),
      avg_intensity: sql<number>`avg(${behaviorsTable.intensity})`.as('avg_intensity'),
      max_intensity: sql<number>`max(${behaviorsTable.intensity})`.as('max_intensity')
    })
    .from(catsTable)
    .leftJoin(behaviorsTable, eq(catsTable.id, behaviorsTable.cat_id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(catsTable.id, catsTable.name)
    .orderBy(desc(catsTable.name))
    .execute();

    // Calculate conspiracy levels based on behavior data
    return results.map(result => {
      // Calculate conspiracy level based on number of behaviors and their intensity
      let level = 0;
      let description = 'Innocent kitten';
      
      // Convert string values to numbers if needed
      const totalBehaviors = typeof result.total_behaviors === 'string' 
        ? parseInt(result.total_behaviors, 10) 
        : result.total_behaviors;
      
      const avgIntensity = result.avg_intensity 
        ? (typeof result.avg_intensity === 'string' 
          ? parseFloat(result.avg_intensity) 
          : result.avg_intensity)
        : null;
      
      const maxIntensity = result.max_intensity 
        ? (typeof result.max_intensity === 'string' 
          ? parseInt(result.max_intensity, 10) 
          : result.max_intensity)
        : null;
      
      if (totalBehaviors > 0) {
        // Base level on behavior count (up to 50 points)
        const behaviorScore = Math.min(50, totalBehaviors * 5);
        
        // Base level on average intensity (up to 30 points)
        const intensityScore = avgIntensity ? Math.min(30, avgIntensity * 3) : 0;
        
        // Bonus for high intensity behavior (up to 20 points)
        const maxIntensityBonus = maxIntensity && maxIntensity >= 8 ? 20 : 0;
        
        level = Math.min(100, Math.round(behaviorScore + intensityScore + maxIntensityBonus));
        
        // Determine description based on level
        if (level >= 80) {
          description = 'Mastermind felon';
        } else if (level >= 60) {
          description = 'Seasoned conspirator';
        } else if (level >= 40) {
          description = 'Aspiring troublemaker';
        } else if (level >= 20) {
          description = 'Suspicious character';
        } else {
          description = 'Mildly concerning';
        }
      }

      return {
        cat_id: result.cat_id,
        cat_name: result.cat_name,
        level,
        description,
        total_behaviors: totalBehaviors,
        date: input?.date ?? new Date()
      };
    });
  } catch (error) {
    console.error('Failed to calculate conspiracy levels:', error);
    throw error;
  }
};
