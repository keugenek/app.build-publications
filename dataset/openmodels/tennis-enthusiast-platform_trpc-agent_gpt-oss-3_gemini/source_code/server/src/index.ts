import { initTRPC } from '@trpc/server';
import { createUserInputSchema, browseUsersInputSchema, createMessageInputSchema, browseMessagesInputSchema } from './schema';
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { sendMessage } from './handlers/send_message';
import { getMessages } from './handlers/get_messages';
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
  // Health check route
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new user profile
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  // Browse user profiles with optional filters
  browseUsers: publicProcedure
    .input(browseUsersInputSchema)
    .query(({ input }) => getUsers(input)),

  // Send a direct message
  sendMessage: publicProcedure
    .input(createMessageInputSchema)
    .mutation(({ input }) => sendMessage(input)),

  // Retrieve messages between two users
  getMessages: publicProcedure
    .input(browseMessagesInputSchema)
    .query(({ input }) => getMessages(input)),
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
