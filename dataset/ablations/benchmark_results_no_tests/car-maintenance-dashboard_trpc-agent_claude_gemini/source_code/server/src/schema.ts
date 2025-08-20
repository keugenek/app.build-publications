import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  license_plate: z.string(),
  current_mileage: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1),
  current_mileage: z.number().int().nonnegative()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  license_plate: z.string().min(1).optional(),
  current_mileage: z.number().int().nonnegative().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Maintenance entry schema
export const maintenanceEntrySchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string(),
  description: z.string().nullable(),
  cost: z.number().nonnegative(),
  mileage_at_service: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type MaintenanceEntry = z.infer<typeof maintenanceEntrySchema>;

// Input schema for creating maintenance entries
export const createMaintenanceEntryInputSchema = z.object({
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string().min(1),
  description: z.string().nullable(),
  cost: z.number().nonnegative(),
  mileage_at_service: z.number().int().nonnegative()
});

export type CreateMaintenanceEntryInput = z.infer<typeof createMaintenanceEntryInputSchema>;

// Input schema for updating maintenance entries
export const updateMaintenanceEntryInputSchema = z.object({
  id: z.number(),
  service_date: z.coerce.date().optional(),
  service_type: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  cost: z.number().nonnegative().optional(),
  mileage_at_service: z.number().int().nonnegative().optional()
});

export type UpdateMaintenanceEntryInput = z.infer<typeof updateMaintenanceEntryInputSchema>;

// Service schedule schema for tracking upcoming services
export const serviceScheduleSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_type: z.string(),
  interval_type: z.enum(['mileage', 'time']),
  interval_value: z.number().int().positive(), // miles or months
  last_service_date: z.coerce.date().nullable(),
  last_service_mileage: z.number().int().nonnegative().nullable(),
  next_service_date: z.coerce.date().nullable(),
  next_service_mileage: z.number().int().nonnegative().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ServiceSchedule = z.infer<typeof serviceScheduleSchema>;

// Input schema for creating service schedules
export const createServiceScheduleInputSchema = z.object({
  car_id: z.number(),
  service_type: z.string().min(1),
  interval_type: z.enum(['mileage', 'time']),
  interval_value: z.number().int().positive(),
  last_service_date: z.coerce.date().nullable(),
  last_service_mileage: z.number().int().nonnegative().nullable()
});

export type CreateServiceScheduleInput = z.infer<typeof createServiceScheduleInputSchema>;

// Input schema for updating service schedules
export const updateServiceScheduleInputSchema = z.object({
  id: z.number(),
  service_type: z.string().min(1).optional(),
  interval_type: z.enum(['mileage', 'time']).optional(),
  interval_value: z.number().int().positive().optional(),
  last_service_date: z.coerce.date().nullable().optional(),
  last_service_mileage: z.number().int().nonnegative().nullable().optional(),
  is_active: z.boolean().optional()
});

export type UpdateServiceScheduleInput = z.infer<typeof updateServiceScheduleInputSchema>;

// Query input schemas
export const getCarByIdInputSchema = z.object({
  id: z.number()
});

export type GetCarByIdInput = z.infer<typeof getCarByIdInputSchema>;

export const deleteCarInputSchema = z.object({
  id: z.number()
});

export type DeleteCarInput = z.infer<typeof deleteCarInputSchema>;

export const getMaintenanceEntriesByCarInputSchema = z.object({
  carId: z.number()
});

export type GetMaintenanceEntriesByCarInput = z.infer<typeof getMaintenanceEntriesByCarInputSchema>;

export const deleteMaintenanceEntryInputSchema = z.object({
  id: z.number()
});

export type DeleteMaintenanceEntryInput = z.infer<typeof deleteMaintenanceEntryInputSchema>;

export const getServiceSchedulesByCarInputSchema = z.object({
  carId: z.number()
});

export type GetServiceSchedulesByCarInput = z.infer<typeof getServiceSchedulesByCarInputSchema>;

export const deleteServiceScheduleInputSchema = z.object({
  id: z.number()
});

export type DeleteServiceScheduleInput = z.infer<typeof deleteServiceScheduleInputSchema>;
