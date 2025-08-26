import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createBirthdayCardInputSchema, 
  addGalleryImageInputSchema, 
  updateBirthdayCardInputSchema 
} from './schema';

// Import handlers
import { createBirthdayCard } from './handlers/create_birthday_card';
import { getBirthdayCards } from './handlers/get_birthday_cards';
import { getBirthdayCardWithImages } from './handlers/get_birthday_card_with_images';
import { addGalleryImage } from './handlers/add_gallery_image';
import { updateBirthdayCard } from './handlers/update_birthday_card';
import { deleteGalleryImage } from './handlers/delete_gallery_image';

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

  getBirthdayCards: publicProcedure
    .query(() => getBirthdayCards()),

  getBirthdayCardWithImages: publicProcedure
    .input(z.object({ cardId: z.number() }))
    .query(({ input }) => getBirthdayCardWithImages(input.cardId)),

  updateBirthdayCard: publicProcedure
    .input(updateBirthdayCardInputSchema)
    .mutation(({ input }) => updateBirthdayCard(input)),

  // Gallery image operations
  addGalleryImage: publicProcedure
    .input(addGalleryImageInputSchema)
    .mutation(({ input }) => addGalleryImage(input)),

  deleteGalleryImage: publicProcedure
    .input(z.object({ imageId: z.number() }))
    .mutation(({ input }) => deleteGalleryImage(input.imageId)),
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
