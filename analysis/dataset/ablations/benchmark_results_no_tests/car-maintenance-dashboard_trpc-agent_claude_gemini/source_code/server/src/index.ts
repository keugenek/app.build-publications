import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import all schemas
import {
  createCarInputSchema,
  updateCarInputSchema,
  getCarByIdInputSchema,
  deleteCarInputSchema,
  createMaintenanceEntryInputSchema,
  updateMaintenanceEntryInputSchema,
  getMaintenanceEntriesByCarInputSchema,
  deleteMaintenanceEntryInputSchema,
  createServiceScheduleInputSchema,
  updateServiceScheduleInputSchema,
  getServiceSchedulesByCarInputSchema,
  deleteServiceScheduleInputSchema
} from './schema';

// Import all handlers
import { createCar } from './handlers/create_car';
import { getCars } from './handlers/get_cars';
import { getCarById } from './handlers/get_car_by_id';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { createMaintenanceEntry } from './handlers/create_maintenance_entry';
import { getMaintenanceEntriesByCarId } from './handlers/get_maintenance_entries_by_car';
import { updateMaintenanceEntry } from './handlers/update_maintenance_entry';
import { deleteMaintenanceEntry } from './handlers/delete_maintenance_entry';
import { createServiceSchedule } from './handlers/create_service_schedule';
import { getServiceSchedulesByCarId } from './handlers/get_service_schedules_by_car';
import { updateServiceSchedule } from './handlers/update_service_schedule';
import { deleteServiceSchedule } from './handlers/delete_service_schedule';
import { getUpcomingServices } from './handlers/get_upcoming_services';

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

  getCarById: publicProcedure
    .input(getCarByIdInputSchema)
    .query(({ input }) => getCarById(input)),

  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),

  deleteCar: publicProcedure
    .input(deleteCarInputSchema)
    .mutation(({ input }) => deleteCar(input)),

  // Maintenance entry management routes
  createMaintenanceEntry: publicProcedure
    .input(createMaintenanceEntryInputSchema)
    .mutation(({ input }) => createMaintenanceEntry(input)),

  getMaintenanceEntriesByCarId: publicProcedure
    .input(getMaintenanceEntriesByCarInputSchema)
    .query(({ input }) => getMaintenanceEntriesByCarId(input)),

  updateMaintenanceEntry: publicProcedure
    .input(updateMaintenanceEntryInputSchema)
    .mutation(({ input }) => updateMaintenanceEntry(input)),

  deleteMaintenanceEntry: publicProcedure
    .input(deleteMaintenanceEntryInputSchema)
    .mutation(({ input }) => deleteMaintenanceEntry(input)),

  // Service schedule management routes
  createServiceSchedule: publicProcedure
    .input(createServiceScheduleInputSchema)
    .mutation(({ input }) => createServiceSchedule(input)),

  getServiceSchedulesByCarId: publicProcedure
    .input(getServiceSchedulesByCarInputSchema)
    .query(({ input }) => getServiceSchedulesByCarId(input)),

  updateServiceSchedule: publicProcedure
    .input(updateServiceScheduleInputSchema)
    .mutation(({ input }) => updateServiceSchedule(input)),

  deleteServiceSchedule: publicProcedure
    .input(deleteServiceScheduleInputSchema)
    .mutation(({ input }) => deleteServiceSchedule(input)),

  // Dashboard route for upcoming services
  getUpcomingServices: publicProcedure
    .query(() => getUpcomingServices()),
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
  console.log(`Car Maintenance Dashboard TRPC server listening at port: ${port}`);
}

start();
