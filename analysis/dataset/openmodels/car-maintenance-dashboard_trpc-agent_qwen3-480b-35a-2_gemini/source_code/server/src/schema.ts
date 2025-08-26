import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  licensePlate: z.string(),
  vin: z.string(),
  nextServiceDate: z.coerce.date().nullable(),
  nextServiceMileage: z.number().int().nullable(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Maintenance entry schema
export const maintenanceEntrySchema = z.object({
  id: z.number(),
  carId: z.number(),
  dateOfService: z.coerce.date(),
  serviceType: z.string(),
  cost: z.number(),
  mileage: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceEntry = z.infer<typeof maintenanceEntrySchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int().positive(),
  licensePlate: z.string(),
  vin: z.string(),
  nextServiceDate: z.coerce.date().nullable().optional(),
  nextServiceMileage: z.number().int().nonnegative().nullable().optional()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().positive().optional(),
  licensePlate: z.string().optional(),
  vin: z.string().optional(),
  nextServiceDate: z.coerce.date().nullable().optional(),
  nextServiceMileage: z.number().int().nonnegative().nullable().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Input schema for creating maintenance entries
export const createMaintenanceEntryInputSchema = z.object({
  carId: z.number(),
  dateOfService: z.coerce.date(),
  serviceType: z.string(),
  cost: z.number().nonnegative(),
  mileage: z.number().int().nonnegative(),
  notes: z.string().nullable().optional()
});

export type CreateMaintenanceEntryInput = z.infer<typeof createMaintenanceEntryInputSchema>;

// Input schema for updating maintenance entries
export const updateMaintenanceEntryInputSchema = z.object({
  id: z.number(),
  carId: z.number().optional(),
  dateOfService: z.coerce.date().optional(),
  serviceType: z.string().optional(),
  cost: z.number().nonnegative().optional(),
  mileage: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceEntryInput = z.infer<typeof updateMaintenanceEntryInputSchema>;
