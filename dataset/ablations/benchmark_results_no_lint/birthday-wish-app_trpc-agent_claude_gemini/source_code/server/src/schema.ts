import { z } from 'zod';

// Birthday card schema
export const birthdayCardSchema = z.object({
  id: z.number(),
  recipient_name: z.string(),
  message: z.string(),
  sender_name: z.string(),
  theme: z.enum(['confetti', 'balloons', 'sparkles']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Photo gallery schema
export const photoSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  image_url: z.string().url(),
  caption: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type Photo = z.infer<typeof photoSchema>;

// Input schema for creating birthday cards
export const createBirthdayCardInputSchema = z.object({
  recipient_name: z.string().min(1, 'Recipient name is required'),
  message: z.string().min(1, 'Birthday message is required'),
  sender_name: z.string().min(1, 'Sender name is required'),
  theme: z.enum(['confetti', 'balloons', 'sparkles'])
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Input schema for updating birthday cards
export const updateBirthdayCardInputSchema = z.object({
  id: z.number(),
  recipient_name: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  sender_name: z.string().min(1).optional(),
  theme: z.enum(['confetti', 'balloons', 'sparkles']).optional()
});

export type UpdateBirthdayCardInput = z.infer<typeof updateBirthdayCardInputSchema>;

// Input schema for adding photos to gallery
export const addPhotoInputSchema = z.object({
  card_id: z.number(),
  image_url: z.string().url(),
  caption: z.string().nullable(),
  display_order: z.number().int().nonnegative()
});

export type AddPhotoInput = z.infer<typeof addPhotoInputSchema>;

// Input schema for updating photos
export const updatePhotoInputSchema = z.object({
  id: z.number(),
  image_url: z.string().url().optional(),
  caption: z.string().nullable().optional(),
  display_order: z.number().int().nonnegative().optional()
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoInputSchema>;

// Response schema for birthday card with photos
export const birthdayCardWithPhotosSchema = z.object({
  id: z.number(),
  recipient_name: z.string(),
  message: z.string(),
  sender_name: z.string(),
  theme: z.enum(['confetti', 'balloons', 'sparkles']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  photos: z.array(photoSchema)
});

export type BirthdayCardWithPhotos = z.infer<typeof birthdayCardWithPhotosSchema>;
