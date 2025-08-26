import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas and handlers
import { createMaintenanceInputSchema, createReminderInputSchema } from './schema';
import { createMaintenanceRecord } from './handlers/create_maintenance_record';
import { getMaintenanceRecords } from './handlers/get_maintenance_records';
import { createReminder } from './handlers/create_reminder';
import { getReminders } from './handlers/get_reminders';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  // Maintenance record routes
  createMaintenance: publicProcedure
    .input(createMaintenanceInputSchema)
    .mutation(({ input }) => createMaintenanceRecord(input)),
  getMaintenanceRecords: publicProcedure.query(() => getMaintenanceRecords()),
  // Reminder routes
  createReminder: publicProcedure
    .input(createReminderInputSchema)
    .mutation(({ input }) => createReminder(input)),
  getReminders: publicProcedure.query(() => getReminders()),
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
