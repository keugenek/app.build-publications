import { initTRPC } from '@trpc/server';
import { createUserInputSchema, searchPlayersInputSchema, createMatchInputSchema, sendMessageInputSchema, updateUserInputSchema } from './schema';
import { updateUser } from './handlers/update_user';
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { searchPlayers } from './handlers/search_players';
import { createMatch } from './handlers/create_match';
import { sendMessage } from './handlers/send_message';
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
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Users
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  getUsers: publicProcedure.query(() => getUsers()),
  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),
  // Search
  searchPlayers: publicProcedure
    .input(searchPlayersInputSchema)
    .query(({ input }) => searchPlayers(input)),
  // Matches
  createMatch: publicProcedure
    .input(createMatchInputSchema)
    .mutation(({ input }) => createMatch(input)),
  // Messaging
  sendMessage: publicProcedure
    .input(sendMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),


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
