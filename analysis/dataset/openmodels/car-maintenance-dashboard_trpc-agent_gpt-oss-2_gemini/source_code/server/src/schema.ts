import { z } from 'zod';

// ----------- Car Schemas -----------
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  license_plate: z.string(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

export const createCarInputSchema = z.object({
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  license_plate: z.string()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().optional(),
  license_plate: z.string().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// ----------- Maintenance Record Schemas -----------
export const maintenanceRecordSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string(),
  odometer: z.number().int(),
  cost: z.number(),
  notes: z.string().nullable(),
  next_service_due: z.coerce.date().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;

export const createMaintenanceInputSchema = z.object({
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string(),
  odometer: z.number().int(),
  cost: z.number().positive(),
  notes: z.string().nullable().optional(),
  next_service_due: z.coerce.date().nullable().optional()
});

export type CreateMaintenanceInput = z.infer<typeof createMaintenanceInputSchema>;

export const updateMaintenanceInputSchema = z.object({
  id: z.number(),
  service_date: z.coerce.date().optional(),
  service_type: z.string().optional(),
  odometer: z.number().int().optional(),
  cost: z.number().positive().optional(),
  notes: z.string().nullable().optional(),
  next_service_due: z.coerce.date().nullable().optional()
});

export type UpdateMaintenanceInput = z.infer<typeof updateMaintenanceInputSchema>;
