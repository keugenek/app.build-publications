import { z } from 'zod';

// Birthday card schema
export const birthdayCardSchema = z.object({
  id: z.number(),
  recipientName: z.string(),
  message: z.string(),
  senderName: z.string(),
  createdAt: z.coerce.date()
});

export type BirthdayCard = z.infer<typeof birthdayCardSchema>;

// Input schema for creating a birthday card
export const createBirthdayCardInputSchema = z.object({
  recipientName: z.string().min(1, "Recipient name is required"),
  message: z.string().min(1, "Message is required"),
  senderName: z.string().min(1, "Sender name is required")
});

export type CreateBirthdayCardInput = z.infer<typeof createBirthdayCardInputSchema>;

// Photo schema
export const photoSchema = z.object({
  id: z.number(),
  cardId: z.number(),
  url: z.string().url(),
  caption: z.string().nullable(),
  createdAt: z.coerce.date()
});

export type Photo = z.infer<typeof photoSchema>;

// Input schema for adding a photo
export const addPhotoInputSchema = z.object({
  cardId: z.number(),
  url: z.string().url(),
  caption: z.string().nullable()
});

export type AddPhotoInput = z.infer<typeof addPhotoInputSchema>;