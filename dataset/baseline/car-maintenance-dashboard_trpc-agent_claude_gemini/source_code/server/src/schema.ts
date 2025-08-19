import { z } from 'zod';

// Car schema
export const carSchema = z.object({
  id: z.number(),
  make: z.string(),
  model: z.string(),
  year: z.number().int(),
  license_plate: z.string(),
  created_at: z.coerce.date()
});

export type Car = z.infer<typeof carSchema>;

// Input schema for creating cars
export const createCarInputSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  license_plate: z.string().min(1)
});

export type CreateCarInput = z.infer<typeof createCarInputSchema>;

// Input schema for updating cars
export const updateCarInputSchema = z.object({
  id: z.number(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  license_plate: z.string().min(1).optional()
});

export type UpdateCarInput = z.infer<typeof updateCarInputSchema>;

// Service type enum
export const serviceTypeSchema = z.enum([
  'oil_change',
  'tire_rotation',
  'brake_service',
  'transmission_service',
  'engine_tune_up',
  'air_filter_replacement',
  'battery_replacement',
  'coolant_service',
  'inspection',
  'other'
]);

export type ServiceType = z.infer<typeof serviceTypeSchema>;

// Maintenance entry schema
export const maintenanceEntrySchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_date: z.coerce.date(),
  mileage: z.number().int().nonnegative(),
  service_type: serviceTypeSchema,
  cost: z.number().nonnegative(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type MaintenanceEntry = z.infer<typeof maintenanceEntrySchema>;

// Input schema for creating maintenance entries
export const createMaintenanceEntryInputSchema = z.object({
  car_id: z.number(),
  service_date: z.coerce.date(),
  mileage: z.number().int().nonnegative(),
  service_type: serviceTypeSchema,
  cost: z.number().nonnegative(),
  notes: z.string().nullable()
});

export type CreateMaintenanceEntryInput = z.infer<typeof createMaintenanceEntryInputSchema>;

// Input schema for updating maintenance entries
export const updateMaintenanceEntryInputSchema = z.object({
  id: z.number(),
  service_date: z.coerce.date().optional(),
  mileage: z.number().int().nonnegative().optional(),
  service_type: serviceTypeSchema.optional(),
  cost: z.number().nonnegative().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateMaintenanceEntryInput = z.infer<typeof updateMaintenanceEntryInputSchema>;

// Reminder type enum
export const reminderTypeSchema = z.enum(['date_based', 'mileage_based']);

export type ReminderType = z.infer<typeof reminderTypeSchema>;

// Service reminder schema
export const serviceReminderSchema = z.object({
  id: z.number(),
  car_id: z.number(),
  service_type: serviceTypeSchema,
  reminder_type: reminderTypeSchema,
  due_date: z.coerce.date().nullable(),
  due_mileage: z.number().int().nullable(),
  is_completed: z.boolean(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type ServiceReminder = z.infer<typeof serviceReminderSchema>;

// Input schema for creating service reminders
export const createServiceReminderInputSchema = z.object({
  car_id: z.number(),
  service_type: serviceTypeSchema,
  reminder_type: reminderTypeSchema,
  due_date: z.coerce.date().nullable(),
  due_mileage: z.number().int().nonnegative().nullable(),
  notes: z.string().nullable()
}).refine(
  (data) => {
    // Ensure date_based reminders have due_date and mileage_based have due_mileage
    if (data.reminder_type === 'date_based') {
      return data.due_date !== null;
    }
    if (data.reminder_type === 'mileage_based') {
      return data.due_mileage !== null;
    }
    return true;
  },
  {
    message: "Date-based reminders must have due_date, mileage-based reminders must have due_mileage"
  }
);

export type CreateServiceReminderInput = z.infer<typeof createServiceReminderInputSchema>;

// Input schema for updating service reminders
export const updateServiceReminderInputSchema = z.object({
  id: z.number(),
  service_type: serviceTypeSchema.optional(),
  reminder_type: reminderTypeSchema.optional(),
  due_date: z.coerce.date().nullable().optional(),
  due_mileage: z.number().int().nonnegative().nullable().optional(),
  is_completed: z.boolean().optional(),
  notes: z.string().nullable().optional()
});

export type UpdateServiceReminderInput = z.infer<typeof updateServiceReminderInputSchema>;

// Query schema for getting maintenance entries by car
export const getMaintenanceEntriesByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetMaintenanceEntriesByCarInput = z.infer<typeof getMaintenanceEntriesByCarInputSchema>;

// Query schema for getting service reminders by car
export const getServiceRemindersByCarInputSchema = z.object({
  car_id: z.number()
});

export type GetServiceRemindersByCarInput = z.infer<typeof getServiceRemindersByCarInputSchema>;
