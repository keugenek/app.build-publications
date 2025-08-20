import { z } from 'zod';

// Schema for birthday card content
export const birthdayCardSchema = z.object({
  id: z.number(),
  title: z.string(),
  message: z.string(),
  recipientName: z.string(),
  celebrationType: z.enum(['confetti', 'balloons', 'both']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Input schema for creating a birthday card
export const createBirthdayCardInputSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  recipientName: z.string().min(1).max(50),
  celebrationType: z.enum(['confetti', 'balloons', 'both']),
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Input schema for updating a birthday card
export const updateBirthdayCardInputSchema = z.object({
  id: z.number(),
  title: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(1000).optional(),
  recipientName: z.string().min(1).max(50).optional(),
  celebrationType: z.enum(['confetti', 'balloons', 'both']).optional(),
});

export type UpdateBirthdayCardInput = z.infer<typeof updateBirthdayCardInputSchema>;

// Schema for photos in the gallery
export const photoSchema = z.object({
  id: z.number(),
  cardId: z.number(),
  url: z.string().url(),
  caption: z.string().max(200).nullable(),
  order: z.number(),
  createdAt: z.coerce.date(),
});

export type Photo = z.infer<typeof photoSchema>;

// Input schema for adding a photo
export const createPhotoInputSchema = z.object({
  cardId: z.number(),
  url: z.string().url(),
  caption: z.string().max(200).nullable(),
  order: z.number(),
});

export type CreatePhotoInput = z.infer<typeof createPhotoInputSchema>;

// Input schema for updating a photo
export const updatePhotoInputSchema = z.object({
  id: z.number(),
  cardId: z.number().optional(),
  url: z.string().url().optional(),
  caption: z.string().max(200).nullable().optional(),
  order: z.number().optional(),
});

export type UpdatePhotoInput = z.infer<typeof updatePhotoInputSchema>;