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
  searchUsersInputSchema,
  createConnectionRequestInputSchema,
  respondToConnectionRequestInputSchema
} from './schema';

// Import handlers
import { createUserProfile } from './handlers/create_user_profile';
import { getUserProfile } from './handlers/get_user_profile';
import { updateUserProfile } from './handlers/update_user_profile';
import { searchUsers } from './handlers/search_users';
import { getAllUsers } from './handlers/get_all_users';
import { createConnectionRequest } from './handlers/create_connection_request';
import { respondToConnectionRequest } from './handlers/respond_to_connection_request';
import { getUserConnectionRequests } from './handlers/get_user_connection_requests';

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

  // User profile endpoints
  createUserProfile: publicProcedure
    .input(createUserProfileInputSchema)
    .mutation(({ input }) => createUserProfile(input)),

  getUserProfile: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserProfile(input.userId)),

  updateUserProfile: publicProcedure
    .input(updateUserProfileInputSchema)
    .mutation(({ input }) => updateUserProfile(input)),

  getAllUsers: publicProcedure
    .query(() => getAllUsers()),

  searchUsers: publicProcedure
    .input(searchUsersInputSchema)
    .query(({ input }) => searchUsers(input)),

  // Connection request endpoints
  createConnectionRequest: publicProcedure
    .input(createConnectionRequestInputSchema.extend({
      requesterId: z.number() // In a real app, this would come from authentication
    }))
    .mutation(({ input }) => createConnectionRequest(input.requesterId, {
      receiver_id: input.receiver_id,
      message: input.message
    })),

  respondToConnectionRequest: publicProcedure
    .input(respondToConnectionRequestInputSchema.extend({
      userId: z.number() // In a real app, this would come from authentication
    }))
    .mutation(({ input }) => respondToConnectionRequest(input.userId, {
      request_id: input.request_id,
      status: input.status
    })),

  getUserConnectionRequests: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserConnectionRequests(input.userId)),
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
