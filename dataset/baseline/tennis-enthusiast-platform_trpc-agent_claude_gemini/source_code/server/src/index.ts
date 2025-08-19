import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  createUserProfileInputSchema, 
  updateUserProfileInputSchema,
  searchPartnersInputSchema,
  getUserProfileInputSchema
} from './schema';

// Import handlers
import { createUserProfile } from './handlers/create_user_profile';
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { searchPartners } from './handlers/search_partners';
import { getAllProfiles } from './handlers/get_all_profiles';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new tennis player profile
  createUserProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createUserProfile(input)),

  // Get a specific user profile by ID
  getUserProfile: publicProcedure
    .input(getUserProfileInputSchema)
    .query(({ input }) => getUserProfile(input)),

  // Update an existing user profile
  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),

  // Search for tennis partners based on skill level and location
  searchPartners: publicProcedure
    .input(searchPartnersInputSchema)
    .query(({ input }) => searchPartners(input)),

  // Get all user profiles (for browsing all players)
  getAllProfiles: publicProcedure
    .query(() => getAllProfiles()),
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
  console.log(`Tennis Partner Platform TRPC server listening at port: ${port}`);
}

start();
