import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';
import { createUserProfileInputSchema, updateUserProfileInputSchema, searchPlayersInputSchema, sendMessageInputSchema } from './schema';
import { createProfile } from './handlers/create_user_profile';
import { updateProfile } from './handlers/update_user_profile';
import { getProfile } from './handlers/get_user_profile';
import { searchPlayers } from './handlers/search_players';
import { sendMessage } from './handlers/send_message';
import { getMessages } from './handlers/get_messages';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createProfile(input)),
  updateProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateProfile(input)),
  getProfile: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProfile(input.id)),
  searchPlayers: publicProcedure
    .input(searchPlayersInputSchema)
    .query(({ input }) => searchPlayers(input)),
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),
  getMessages: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getMessages(input.userId)),
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
