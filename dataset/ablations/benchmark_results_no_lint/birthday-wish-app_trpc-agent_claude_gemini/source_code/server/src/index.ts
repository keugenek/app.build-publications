import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createBirthdayCardInputSchema, 
  updateBirthdayCardInputSchema,
  addPhotoInputSchema,
  updatePhotoInputSchema
} from './schema';

// Import handlers
import { createBirthdayCard } from './handlers/create_birthday_card';
import { getBirthdayCard } from './handlers/get_birthday_card';
import { getAllBirthdayCards } from './handlers/get_all_birthday_cards';
import { updateBirthdayCard } from './handlers/update_birthday_card';
import { deleteBirthdayCard } from './handlers/delete_birthday_card';
import { addPhoto } from './handlers/add_photo';
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

  // Birthday card operations
  createBirthdayCard: publicProcedure
    .input(createBirthdayCardInputSchema)
    .mutation(({ input }) => createBirthdayCard(input)),

  getBirthdayCard: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getBirthdayCard(input.id)),

  getAllBirthdayCards: publicProcedure
    .query(() => getAllBirthdayCards()),

  updateBirthdayCard: publicProcedure
    .input(updateBirthdayCardInputSchema)
    .mutation(({ input }) => updateBirthdayCard(input)),

  deleteBirthdayCard: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteBirthdayCard(input.id)),

  // Photo gallery operations
  addPhoto: publicProcedure
    .input(addPhotoInputSchema)
    .mutation(({ input }) => addPhoto(input)),

  updatePhoto: publicProcedure
    .input(updatePhotoInputSchema)
    .mutation(({ input }) => updatePhoto(input)),

  deletePhoto: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deletePhoto(input.id)),
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
