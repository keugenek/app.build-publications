import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import {
  createCarInputSchema,
  updateCarInputSchema,
  getCarByIdInputSchema,
  createMaintenanceHistoryInputSchema,
  updateMaintenanceHistoryInputSchema,
  getMaintenanceHistoryByCarInputSchema,
  createServiceReminderInputSchema,
  updateServiceReminderInputSchema,
  getServiceRemindersByCarInputSchema,
  deleteByIdInputSchema
} from './schema';

// Import handlers
import { createCar } from './handlers/create_car';
import { getCars } from './handlers/get_cars';
import { getCarById } from './handlers/get_car_by_id';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { createMaintenanceHistory } from './handlers/create_maintenance_history';
import { getMaintenanceHistoryByCar } from './handlers/get_maintenance_history_by_car';
import { updateMaintenanceHistory } from './handlers/update_maintenance_history';
import { deleteMaintenanceHistory } from './handlers/delete_maintenance_history';
import { createServiceReminder } from './handlers/create_service_reminder';
import { getServiceRemindersByCar } from './handlers/get_service_reminders_by_car';
import { updateServiceReminder } from './handlers/update_service_reminder';
import { deleteServiceReminder } from './handlers/delete_service_reminder';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
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
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteCar(input)),

  // Maintenance history routes
  createMaintenanceHistory: publicProcedure
    .input(createMaintenanceHistoryInputSchema)
    .mutation(({ input }) => createMaintenanceHistory(input)),
  
  getMaintenanceHistoryByCar: publicProcedure
    .input(getMaintenanceHistoryByCarInputSchema)
    .query(({ input }) => getMaintenanceHistoryByCar(input)),
  
  updateMaintenanceHistory: publicProcedure
    .input(updateMaintenanceHistoryInputSchema)
    .mutation(({ input }) => updateMaintenanceHistory(input)),
  
  deleteMaintenanceHistory: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteMaintenanceHistory(input)),

  // Service reminder routes
  createServiceReminder: publicProcedure
    .input(createServiceReminderInputSchema)
    .mutation(({ input }) => createServiceReminder(input)),
  
  getServiceRemindersByCar: publicProcedure
    .input(getServiceRemindersByCarInputSchema)
    .query(({ input }) => getServiceRemindersByCar(input)),
  
  updateServiceReminder: publicProcedure
    .input(updateServiceReminderInputSchema)
    .mutation(({ input }) => updateServiceReminder(input)),
  
  deleteServiceReminder: publicProcedure
    .input(deleteByIdInputSchema)
    .mutation(({ input }) => deleteServiceReminder(input)),
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
