import { z } from 'zod';

// ----- Card Message Schema -----
// Represents a personalized birthday message.
export const messageSchema = z.object({
  id: z.number(),
  message: z.string(),
  created_at: z.coerce.date(),
});
export type Message = z.infer<typeof messageSchema>;

export const createMessageInputSchema = z.object({
  message: z.string().min(1),
});
export type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

// ----- Photo Schema -----
// Represents a photo in the birthday card gallery.
export const photoSchema = z.object({
  id: z.number(),
  url: z.string().url(),
  caption: z.string().nullable(), // caption can be explicitly null
  order: z.number().int().nonnegative(),
  created_at: z.coerce.date(),
});
export type Photo = z.infer<typeof photoSchema>;

export const addPhotoInputSchema = z.object({
  url: z.string().url(),
  caption: z.string().nullable().optional(), // optional field, can be omitted or null
  order: z.number().int().nonnegative(),
});
export type AddPhotoInput = z.infer<typeof addPhotoInputSchema>;
