import { z } from 'zod';

// Birthday card schema
export const birthdayCardSchema = z.object({
  id: z.number(),
  recipient_name: z.string(),
  message: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Photo schema for gallery images
export const photoSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  caption: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type Photo = z.infer<typeof photoSchema>;

// Input schema for creating birthday cards
export const createBirthdayCardInputSchema = z.object({
  recipient_name: z.string().min(1, "Recipient name is required"),
  message: z.string().min(1, "Birthday message is required")
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Input schema for updating birthday cards
export const updateBirthdayCardInputSchema = z.object({
  id: z.number(),
  recipient_name: z.string().min(1, "Recipient name is required").optional(),
  message: z.string().min(1, "Birthday message is required").optional()
});

export type UpdateBirthdayCardInput = z.infer<typeof updateBirthdayCardInputSchema>;

// Input schema for adding photos to gallery
export const createPhotoInputSchema = z.object({
  card_id: z.number(),
  filename: z.string(),
  original_name: z.string(),
  file_size: z.number().positive(),
  mime_type: z.string(),
  caption: z.string().nullable(),
  display_order: z.number().int().nonnegative()
});

export type CreatePhotoInput = z.infer<typeof createPhotoInputSchema>;

// Input schema for updating photo details
export const updatePhotoInputSchema = z.object({
  id: z.number(),
  caption: z.string().nullable().optional(),
  display_order: z.number().int().nonnegative().optional()
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoInputSchema>;

// Schema for getting birthday card with photos
export const birthdayCardWithPhotosSchema = z.object({
  id: z.number(),
  recipient_name: z.string(),
  message: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  photos: z.array(photoSchema)
});

export type BirthdayCardWithPhotos = z.infer<typeof birthdayCardWithPhotosSchema>;
