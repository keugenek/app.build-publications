import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createActivityLogInputSchema, 
  updateActivityLogInputSchema,
  getActivityLogsInputSchema 
} from './schema';

// Import handlers
import { createActivityLog } from './handlers/create_activity_log';
import { getActivityLogs } from './handlers/get_activity_logs';
import { updateActivityLog } from './handlers/update_activity_log';
import { deleteActivityLog } from './handlers/delete_activity_log';
import { getActivityPatterns } from './handlers/get_activity_patterns';
import { getBreakSuggestions } from './handlers/get_break_suggestions';

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

  // Activity log management
  createActivityLog: publicProcedure
    .input(createActivityLogInputSchema)
    .mutation(({ input }) => createActivityLog(input)),

  getActivityLogs: publicProcedure
    .input(getActivityLogsInputSchema)
    .query(({ input }) => getActivityLogs(input)),

  updateActivityLog: publicProcedure
    .input(updateActivityLogInputSchema)
    .mutation(({ input }) => updateActivityLog(input)),

  deleteActivityLog: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteActivityLog(input.id)),

  // Analytics and insights
  getActivityPatterns: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getActivityPatterns(input.userId)),

  getBreakSuggestions: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(({ input }) => getBreakSuggestions(input.userId)),
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
  console.log(`Personal Dashboard TRPC server listening at port: ${port}`);
  console.log('Available endpoints:');
  console.log('- POST /createActivityLog - Log daily activities');
  console.log('- GET /getActivityLogs - Retrieve activity history');
  console.log('- POST /updateActivityLog - Update existing log');
  console.log('- POST /deleteActivityLog - Delete activity log');
  console.log('- GET /getActivityPatterns - Get activity insights');
  console.log('- GET /getBreakSuggestions - Get personalized break suggestions');
}

start();
