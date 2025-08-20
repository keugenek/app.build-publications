import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  vin: z.string(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2), // Reasonable year range
  vin: z.string().min(1).max(17) // VIN is typically 17 characters
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 2).optional(),
  vin: z.string().min(1).max(17).optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Maintenance history schema
export const maintenanceHistorySchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string(),
  mileage: z.number().int(),
  cost: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceHistory = z.infer<typeof maintenanceHistorySchema>;

// Input schema for creating maintenance history
export const createMaintenanceHistoryInputSchema = z.object({
  car_id: z.number(),
  service_date: z.coerce.date(),
  service_type: z.string().min(1),
  mileage: z.number().int().nonnegative(),
  cost: z.number().nonnegative(),
  notes: z.string().nullable()
});

export type CreateMaintenanceHistoryInput = z.infer<typeof createMaintenanceHistoryInputSchema>;

// Input schema for updating maintenance history
export const updateMaintenanceHistoryInputSchema = z.object({
  id: z.number(),
  service_date: z.coerce.date().optional(),
  service_type: z.string().min(1).optional(),
  mileage: z.number().int().nonnegative().optional(),
  cost: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceHistoryInput = z.infer<typeof updateMaintenanceHistoryInputSchema>;

// Service reminder schema
export const serviceReminderSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  due_date: z.coerce.date(),
  service_description: z.string(),
  is_completed: z.boolean(),
  created_at: z.coerce.date()
});

export type ServiceReminder = z.infer<typeof serviceReminderSchema>;

// Input schema for creating service reminders
export const createServiceReminderInputSchema = z.object({
  car_id: z.number(),
  due_date: z.coerce.date(),
  service_description: z.string().min(1),
  is_completed: z.boolean().optional() // Defaults to false in DB
});

export type CreateServiceReminderInput = z.infer<typeof createServiceReminderInputSchema>;

// Input schema for updating service reminders
export const updateServiceReminderInputSchema = z.object({
  id: z.number(),
  due_date: z.coerce.date().optional(),
  service_description: z.string().min(1).optional(),
  is_completed: z.boolean().optional()
});

export type UpdateServiceReminderInput = z.infer<typeof updateServiceReminderInputSchema>;

// Input schema for getting car by ID
export const getCarByIdInputSchema = z.object({
  id: z.number()
});

export type GetCarByIdInput = z.infer<typeof getCarByIdInputSchema>;

// Input schema for getting maintenance history by car ID
export const getMaintenanceHistoryByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetMaintenanceHistoryByCarInput = z.infer<typeof getMaintenanceHistoryByCarInputSchema>;

// Input schema for getting service reminders by car ID
export const getServiceRemindersByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetServiceRemindersByCarInput = z.infer<typeof getServiceRemindersByCarInputSchema>;

// Input schema for deleting records
export const deleteByIdInputSchema = z.object({
  id: z.number()
});

export type DeleteByIdInput = z.infer<typeof deleteByIdInputSchema>;
