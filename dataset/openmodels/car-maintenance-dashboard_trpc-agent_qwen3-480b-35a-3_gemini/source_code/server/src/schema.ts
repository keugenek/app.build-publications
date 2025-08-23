import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
  current_mileage: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Maintenance entry schema
export const maintenanceEntrySchema = z.object({
  id: z.number(),
  car_id: z.number(),
  date: z.coerce.date(),
  service_type: z.string(),
  cost: z.number(),
  mileage_at_service: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MaintenanceEntry = z.infer<typeof maintenanceEntrySchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int().positive(),
  vin: z.string(),
  current_mileage: z.number().int().nonnegative()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  vin: z.string().optional(),
  current_mileage: z.number().int().nonnegative().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Input schema for creating maintenance entries
export const createMaintenanceEntryInputSchema = z.object({
  car_id: z.number(),
  date: z.coerce.date(),
  service_type: z.string(),
  cost: z.number().nonnegative(),
  mileage_at_service: z.number().int().nonnegative(),
  notes: z.string().nullable().optional()
});

export type CreateMaintenanceEntryInput = z.infer<typeof createMaintenanceEntryInputSchema>;

// Input schema for updating maintenance entries
export const updateMaintenanceEntryInputSchema = z.object({
  id: z.number(),
  car_id: z.number().optional(),
  date: z.coerce.date().optional(),
  service_type: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  mileage_at_service: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceEntryInput = z.infer<typeof updateMaintenanceEntryInputSchema>;

// Schema for upcoming services view
export const upcomingServiceSchema = z.object({
  car_id: z.number(),
  make: z.string(),
  model: z.string(),
  vin: z.string(),
  next_service_date: z.coerce.date(),
  next_service_mileage: z.number().int(),
  service_type: z.string()
});

export type UpcomingService = z.infer<typeof upcomingServiceSchema>;
