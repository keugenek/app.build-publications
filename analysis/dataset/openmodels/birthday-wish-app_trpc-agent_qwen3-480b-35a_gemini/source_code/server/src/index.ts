import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createBirthdayCardInputSchema, updateBirthdayCardInputSchema, createPhotoInputSchema, updatePhotoInputSchema } from './schema';
import { createBirthdayCard } from './handlers/create_birthday_card';
import { getBirthdayCards } from './handlers/get_birthday_cards';
import { getBirthdayCardById } from './handlers/get_birthday_card_by_id';
import { updateBirthdayCard } from './handlers/update_birthday_card';
import { deleteBirthdayCard } from './handlers/delete_birthday_card';
import { createPhoto } from './handlers/create_photo';
import { getPhotosByCardId } from './handlers/get_photos_by_card_id';
import { updatePhoto } from './handlers/update_photo';
import { deletePhoto } from './handlers/delete_photo';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Birthday card procedures
  createBirthdayCard: publicProcedure
    .input(createBirthdayCardInputSchema)
    .mutation(({ input }) => createBirthdayCard(input)),
  getBirthdayCards: publicProcedure
    .query(() => getBirthdayCards()),
  getBirthdayCardById: publicProcedure
    .input(z.number())
    .query(({ input }) => getBirthdayCardById(input)),
  updateBirthdayCard: publicProcedure
    .input(updateBirthdayCardInputSchema)
    .mutation(({ input }) => updateBirthdayCard(input)),
  deleteBirthdayCard: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteBirthdayCard(input)),
  
  // Photo procedures
  createPhoto: publicProcedure
    .input(createPhotoInputSchema)
    .mutation(({ input }) => createPhoto(input)),
  getPhotosByCardId: publicProcedure
    .input(z.number())
    .query(({ input }) => getPhotosByCardId(input)),
  updatePhoto: publicProcedure
    .input(updatePhotoInputSchema)
    .mutation(({ input }) => updatePhoto(input)),
  deletePhoto: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deletePhoto(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();