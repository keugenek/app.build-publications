import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string().nullable(),
  license_plate: z.string().nullable(),
  current_mileage: z.number().int(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  vin: z.string().nullable(),
  license_plate: z.string().nullable(),
  current_mileage: z.number().int().nonnegative()
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  vin: z.string().nullable().optional(),
  license_plate: z.string().nullable().optional(),
  current_mileage: z.number().int().nonnegative().optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Service type enum
export const serviceTypeEnum = z.enum([
  'oil_change',
  'tire_rotation',
  'brake_service',
  'engine_tune_up',
  'transmission_service',
  'coolant_flush',
  'air_filter_replacement',
  'battery_replacement',
  'inspection',
  'other'
]);

export type ServiceType = z.infer<typeof serviceTypeEnum>;

// Maintenance record schema
export const maintenanceRecordSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: serviceTypeEnum,
  description: z.string(),
  cost: z.number(),
  mileage: z.number().int(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceRecord = z.infer<typeof maintenanceRecordSchema>;

// Input schema for creating maintenance records
export const createMaintenanceRecordInputSchema = z.object({
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: serviceTypeEnum,
  description: z.string().min(1),
  cost: z.number().nonnegative(),
  mileage: z.number().int().nonnegative(),
  notes: z.string().nullable()
});

export type CreateMaintenanceRecordInput = z.infer<typeof createMaintenanceRecordInputSchema>;

// Input schema for updating maintenance records
export const updateMaintenanceRecordInputSchema = z.object({
  id: z.number(),
  car_id: z.number().optional(),
  service_date: z.coerce.date().optional(),
  service_type: serviceTypeEnum.optional(),
  description: z.string().min(1).optional(),
  cost: z.number().nonnegative().optional(),
  mileage: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordInputSchema>;

// Upcoming service schema
export const upcomingServiceSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_type: serviceTypeEnum,
  description: z.string(),
  due_date: z.coerce.date(),
  due_mileage: z.number().int().nullable(),
  is_completed: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type UpcomingService = z.infer<typeof upcomingServiceSchema>;

// Input schema for creating upcoming services
export const createUpcomingServiceInputSchema = z.object({
  car_id: z.number(),
  service_type: serviceTypeEnum,
  description: z.string().min(1),
  due_date: z.coerce.date(),
  due_mileage: z.number().int().nullable(),
  notes: z.string().nullable()
});

export type CreateUpcomingServiceInput = z.infer<typeof createUpcomingServiceInputSchema>;

// Input schema for updating upcoming services
export const updateUpcomingServiceInputSchema = z.object({
  id: z.number(),
  car_id: z.number().optional(),
  service_type: serviceTypeEnum.optional(),
  description: z.string().min(1).optional(),
  due_date: z.coerce.date().optional(),
  due_mileage: z.number().int().nullable().optional(),
  is_completed: z.boolean().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateUpcomingServiceInput = z.infer<typeof updateUpcomingServiceInputSchema>;

// Query parameters schemas
export const getMaintenanceRecordsByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetMaintenanceRecordsByCarInput = z.infer<typeof getMaintenanceRecordsByCarInputSchema>;

export const getUpcomingServicesByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetUpcomingServicesByCarInput = z.infer<typeof getUpcomingServicesByCarInputSchema>;

export const deleteRecordInputSchema = z.object({
  id: z.number()
});

export type DeleteRecordInput = z.infer<typeof deleteRecordInputSchema>;
