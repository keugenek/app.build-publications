import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  license_plate: z.string(),
  vin: z.string(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Maintenance Record schema
export const maintenanceRecordSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_type: z.string(),
  date: z.coerce.date(),
  mileage: z.number().int(),
  cost: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;

// Upcoming Service schema
export const upcomingServiceSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_type: z.string(),
  due_date: z.coerce.date().nullable(),
  due_mileage: z.number().int().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type UpcomingService = z.infer<typeof upcomingServiceSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int().positive(),
  license_plate: z.string(),
  vin: z.string()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  license_plate: z.string().optional(),
  vin: z.string().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Input schema for creating maintenance records
export const createMaintenanceRecordInputSchema = z.object({
  car_id: z.number(),
  service_type: z.string(),
  date: z.coerce.date(),
  mileage: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  notes: z.string().nullable().optional()
});

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordInputSchema>;

// Input schema for updating maintenance records
export const updateMaintenanceRecordInputSchema = z.object({
  id: z.number(),
  car_id: z.number().optional(),
  service_type: z.string().optional(),
  date: z.coerce.date().optional(),
  mileage: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordInputSchema>;

// Input schema for creating upcoming services
export const createUpcomingServiceInputSchema = z.object({
  car_id: z.number(),
  service_type: z.string(),
  due_date: z.coerce.date().nullable().optional(),
  due_mileage: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreateUpcomingServiceInput = z.infer<typeof createUpcomingServiceInputSchema>;

// Input schema for updating upcoming services
export const updateUpcomingServiceInputSchema = z.object({
  id: z.number(),
  car_id: z.number().optional(),
  service_type: z.string().optional(),
  due_date: z.coerce.date().nullable().optional(),
  due_mileage: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateUpcomingServiceInput = z.infer<typeof updateUpcomingServiceInputSchema>;
