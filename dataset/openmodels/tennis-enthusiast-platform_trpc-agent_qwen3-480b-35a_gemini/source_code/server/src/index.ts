import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserProfileInputSchema, 
  searchPlayersInputSchema,
  updateUserProfileInputSchema
} from './schema';

// Import handlers
import { createProfile } from './handlers/create_user_profile';
import { searchPlayers } from './handlers/search_players';
import { getPlayers } from './handlers/get_players';
import { updateProfile } from './handlers/update_user_profile';

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
  searchPlayers: publicProcedure
    .input(searchPlayersInputSchema)
    .query(({ input }) => searchPlayers(input)),
  getPlayers: publicProcedure
    .query(() => getPlayers()),
  updateProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateProfile(input)),
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
