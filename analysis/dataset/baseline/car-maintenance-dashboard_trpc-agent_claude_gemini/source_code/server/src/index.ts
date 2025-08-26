import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createCarInputSchema,
  updateCarInputSchema,
  createMaintenanceEntryInputSchema,
  updateMaintenanceEntryInputSchema,
  getMaintenanceEntriesByCarInputSchema,
  createServiceReminderInputSchema,
  updateServiceReminderInputSchema,
  getServiceRemindersByCarInputSchema
} from './schema';

// Import handlers
import { createCar } from './handlers/create_car';
import { getCars } from './handlers/get_cars';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { createMaintenanceEntry } from './handlers/create_maintenance_entry';
import { getMaintenanceEntriesByCarId } from './handlers/get_maintenance_entries_by_car';
import { getAllMaintenanceEntries } from './handlers/get_all_maintenance_entries';
import { updateMaintenanceEntry } from './handlers/update_maintenance_entry';
import { deleteMaintenanceEntry } from './handlers/delete_maintenance_entry';
import { createServiceReminder } from './handlers/create_service_reminder';
import { getServiceRemindersByCarId } from './handlers/get_service_reminders_by_car';
import { getAllServiceReminders } from './handlers/get_all_service_reminders';
import { getUpcomingServiceReminders } from './handlers/get_upcoming_service_reminders';
import { updateServiceReminder } from './handlers/update_service_reminder';
import { deleteServiceReminder } from './handlers/delete_service_reminder';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Car management routes
  createCar: publicProcedure
    .input(createCarInputSchema)
    .mutation(({ input }) => createCar(input)),

  getCars: publicProcedure
    .query(() => getCars()),

  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),

  deleteCar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCar(input.id)),

  // Maintenance entry management routes
  createMaintenanceEntry: publicProcedure
    .input(createMaintenanceEntryInputSchema)
    .mutation(({ input }) => createMaintenanceEntry(input)),

  getMaintenanceEntriesByCarId: publicProcedure
    .input(getMaintenanceEntriesByCarInputSchema)
    .query(({ input }) => getMaintenanceEntriesByCarId(input)),

  getAllMaintenanceEntries: publicProcedure
    .query(() => getAllMaintenanceEntries()),

  updateMaintenanceEntry: publicProcedure
    .input(updateMaintenanceEntryInputSchema)
    .mutation(({ input }) => updateMaintenanceEntry(input)),

  deleteMaintenanceEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMaintenanceEntry(input.id)),

  // Service reminder management routes
  createServiceReminder: publicProcedure
    .input(createServiceReminderInputSchema)
    .mutation(({ input }) => createServiceReminder(input)),

  getServiceRemindersByCarId: publicProcedure
    .input(getServiceRemindersByCarInputSchema)
    .query(({ input }) => getServiceRemindersByCarId(input)),

  getAllServiceReminders: publicProcedure
    .query(() => getAllServiceReminders()),

  getUpcomingServiceReminders: publicProcedure
    .query(() => getUpcomingServiceReminders()),

  updateServiceReminder: publicProcedure
    .input(updateServiceReminderInputSchema)
    .mutation(({ input }) => updateServiceReminder(input)),

  deleteServiceReminder: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteServiceReminder(input.id)),
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
