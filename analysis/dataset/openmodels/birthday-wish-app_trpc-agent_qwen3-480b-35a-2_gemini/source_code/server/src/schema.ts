import { z } from 'zod';

// Birthday message schema
export const birthdayMessageSchema = z.object({
  id: z.number(),
  recipient_name: z.string(),
  message: z.string(),
  created_at: z.coerce.date()
});

export type BirthdayMessage = z.infer<typeof birthdayMessageSchema>;

// Input schema for creating birthday messages
export const createBirthdayMessageInputSchema = z.object({
  recipient_name: z.string().min(1),
  message: z.string().min(1)
});

export type CreateBirthdayMessageInput = z.infer<typeof createBirthdayMessageInputSchema>;

// Gallery image schema
export const galleryImageSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string().url(),
  order_index: z.number().int(),
  created_at: z.coerce.date()
});

export type GalleryImage = z.infer<typeof galleryImageSchema>;

// Input schema for creating gallery images
export const createGalleryImageInputSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  order_index: z.number().int()
});

export type CreateGalleryImageInput = z.infer<typeof createGalleryImageInputSchema>;
