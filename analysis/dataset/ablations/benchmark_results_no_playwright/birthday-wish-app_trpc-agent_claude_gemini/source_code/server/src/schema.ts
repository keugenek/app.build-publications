import { z } from 'zod';

// Birthday card schema
export const birthdayCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  recipient_name: z.string(),
  sender_name: z.string(),
  theme_color: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Photo gallery schema
export const photoSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  image_url: z.string(),
  caption: z.string().nullable(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type Photo = z.infer<typeof photoSchema>;

// Input schema for creating birthday card
export const createBirthdayCardInputSchema = z.object({
  title: z.string(),
  message: z.string(),
  recipient_name: z.string(),
  sender_name: z.string(),
  theme_color: z.string().default('#ff69b4'), // Default pink theme
  is_active: z.boolean().default(true)
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Input schema for adding photos
export const createPhotoInputSchema = z.object({
  card_id: z.number(),
  image_url: z.string(),
  caption: z.string().nullable(),
  display_order: z.number().int()
});

export type CreatePhotoInput = z.infer<typeof createPhotoInputSchema>;

// Birthday card with photos combined response
export const birthdayCardWithPhotosSchema = z.object({
  card: birthdayCardSchema,
  photos: z.array(photoSchema)
});

export type BirthdayCardWithPhotos = z.infer<typeof birthdayCardWithPhotosSchema>;
