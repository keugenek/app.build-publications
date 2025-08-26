import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserProfileInputSchema, 
  updateUserProfileInputSchema,
  searchFiltersSchema,
  createConnectionInputSchema,
  updateConnectionStatusInputSchema
} from './schema';

// Import handlers
import { createUserProfile } from './handlers/create_user_profile';
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { searchPlayers } from './handlers/search_players';
import { createConnection } from './handlers/create_connection';
import { getUserConnections } from './handlers/get_user_connections';
import { updateConnectionStatus } from './handlers/update_connection_status';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User profile management
  createUserProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createUserProfile(input)),
    
  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserProfile(input.userId)),
    
  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),
  
  // Player search
  searchPlayers: publicProcedure
    .input(searchFiltersSchema)
    .query(({ input }) => searchPlayers(input)),
  
  // Connection management
  createConnection: publicProcedure
    .input(createConnectionInputSchema)
    .mutation(({ input }) => createConnection(input)),
    
  getUserConnections: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserConnections(input.userId)),
    
  updateConnectionStatus: publicProcedure
    .input(updateConnectionStatusInputSchema)
    .mutation(({ input }) => updateConnectionStatus(input)),
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
  console.log(`🎾 Tennis Connect TRPC server listening at port: ${port}`);
}

start();
