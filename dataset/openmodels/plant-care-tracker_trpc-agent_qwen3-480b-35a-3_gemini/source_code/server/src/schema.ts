import { z } from 'zod';

// Define enums for light level and humidity
export const lightLevelEnum = z.enum(['low', 'medium', 'high']);
export type LightLevel = z.infer<typeof lightLevelEnum>;

export const humidityEnum = z.enum(['low', 'medium', 'high']);
export type Humidity = z.infer<typeof humidityEnum>;

// Plant schema with proper date handling
export const plantSchema = z.object({
  id: z.number(),
  name: z.string(),
  lastWateredDate: z.string(), // Drizzle returns dates as strings from DB
  lightLevel: lightLevelEnum,
  humidity: humidityEnum,
  created_at: z.coerce.date()
});

export type Plant = z.infer<typeof plantSchema>;

// Input schema for creating plants
export const createPlantInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  lastWateredDate: z.string(), // Expect string date format
  lightLevel: lightLevelEnum,
  humidity: humidityEnum
});

export type CreatePlantInput = z.infer<typeof createPlantInputSchema>;

// Input schema for updating plants
export const updatePlantInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Name is required").optional(),
  lastWateredDate: z.string().optional(), // Optional string date
  lightLevel: lightLevelEnum.optional(),
  humidity: humidityEnum.optional()
});

export type UpdatePlantInput = z.infer<typeof updatePlantInputSchema>;

// Schema for plant with calculated mood
export const plantWithMoodSchema = plantSchema.extend({
  mood: z.string()
});

export type PlantWithMood = z.infer<typeof plantWithMoodSchema>;
