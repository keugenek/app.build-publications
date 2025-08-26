import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createBirthdayMessageInputSchema } from './schema';
import { createBirthdayMessage } from './handlers/create_birthday_message';
import { getBirthdayMessages } from './handlers/get_birthday_messages';
import { createGalleryImageInputSchema } from './schema';
import { createGalleryImage } from './handlers/create_gallery_image';
import { getGalleryImages } from './handlers/get_gallery_images';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createBirthdayMessage: publicProcedure
    .input(createBirthdayMessageInputSchema)
    .mutation(({ input }) => createBirthdayMessage(input)),
  getBirthdayMessages: publicProcedure
    .query(() => getBirthdayMessages()),
  createGalleryImage: publicProcedure
    .input(createGalleryImageInputSchema)
    .mutation(({ input }) => createGalleryImage(input)),
  getGalleryImages: publicProcedure
    .query(() => getGalleryImages()),
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
