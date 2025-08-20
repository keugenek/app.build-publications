import { z } from 'zod';

// Birthday card schema
export const birthdayCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  recipient_name: z.string(),
  sender_name: z.string(),
  created_at: z.coerce.date(),
  is_active: z.boolean()
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Photo gallery image schema
export const galleryImageSchema = z.object({
  id: z.number(),
  card_id: z.number(),
  image_url: z.string().url(),
  alt_text: z.string(),
  display_order: z.number().int(),
  created_at: z.coerce.date()
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

// Input schema for creating birthday cards
export const createBirthdayCardInputSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  recipient_name: z.string().min(1, "Recipient name is required"),
  sender_name: z.string().min(1, "Sender name is required")
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Input schema for adding gallery images
export const addGalleryImageInputSchema = z.object({
  card_id: z.number(),
  image_url: z.string().url(),
  alt_text: z.string(),
  display_order: z.number().int().nonnegative()
});

export type AddGalleryImageInput = z.infer<typeof addGalleryImageInputSchema>;

// Input schema for updating birthday cards
export const updateBirthdayCardInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).optional(),
  message: z.string().min(1).optional(),
  recipient_name: z.string().min(1).optional(),
  sender_name: z.string().min(1).optional(),
  is_active: z.boolean().optional()
});

export type UpdateBirthdayCardInput = z.infer<typeof updateBirthdayCardInputSchema>;

// Response schema for birthday card with images
export const birthdayCardWithImagesSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  recipient_name: z.string(),
  sender_name: z.string(),
  created_at: z.coerce.date(),
  is_active: z.boolean(),
  images: z.array(galleryImageSchema)
});

export type BirthdayCardWithImages = z.infer<typeof birthdayCardWithImagesSchema>;
