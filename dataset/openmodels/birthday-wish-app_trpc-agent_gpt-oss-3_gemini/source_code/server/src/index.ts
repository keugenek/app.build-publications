import { initTRPC } from '@trpc/server';
import { createMessageInputSchema, addPhotoInputSchema } from './schema';
import { createMessage } from './handlers/create_message';
import { getMessages } from './handlers/get_messages';
import { addPhoto } from './handlers/add_photo';
import { getPhotos } from './handlers/get_photos';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Message routes
  createMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => createMessage(input)),
  getMessages: publicProcedure.query(() => getMessages()),

  // Photo routes
  addPhoto: publicProcedure
    .input(addPhotoInputSchema)
    .mutation(({ input }) => addPhoto(input)),
  getPhotos: publicProcedure.query(() => getPhotos()),
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
