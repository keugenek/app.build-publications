import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCarInputSchema,
  updateCarInputSchema,
  createMaintenanceRecordInputSchema,
  updateMaintenanceRecordInputSchema,
  getMaintenanceRecordsByCarInputSchema,
  createUpcomingServiceInputSchema,
  updateUpcomingServiceInputSchema,
  getUpcomingServicesByCarInputSchema,
  deleteRecordInputSchema
} from './schema';

// Import handlers
import { createCar } from './handlers/create_car';
import { getCars } from './handlers/get_cars';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { createMaintenanceRecord } from './handlers/create_maintenance_record';
import { getMaintenanceRecords } from './handlers/get_maintenance_records';
import { getMaintenanceRecordsByCarId } from './handlers/get_maintenance_records_by_car';
import { updateMaintenanceRecord } from './handlers/update_maintenance_record';
import { deleteMaintenanceRecord } from './handlers/delete_maintenance_record';
import { createUpcomingService } from './handlers/create_upcoming_service';
import { getUpcomingServices } from './handlers/get_upcoming_services';
import { getUpcomingServicesByCarId } from './handlers/get_upcoming_services_by_car';
import { updateUpcomingService } from './handlers/update_upcoming_service';
import { deleteUpcomingService } from './handlers/delete_upcoming_service';

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
    .input(deleteRecordInputSchema)
    .mutation(({ input }) => deleteCar(input)),

  // Maintenance record routes
  createMaintenanceRecord: publicProcedure
    .input(createMaintenanceRecordInputSchema)
    .mutation(({ input }) => createMaintenanceRecord(input)),
  
  getMaintenanceRecords: publicProcedure
    .query(() => getMaintenanceRecords()),
  
  getMaintenanceRecordsByCarId: publicProcedure
    .input(getMaintenanceRecordsByCarInputSchema)
    .query(({ input }) => getMaintenanceRecordsByCarId(input)),
  
  updateMaintenanceRecord: publicProcedure
    .input(updateMaintenanceRecordInputSchema)
    .mutation(({ input }) => updateMaintenanceRecord(input)),
  
  deleteMaintenanceRecord: publicProcedure
    .input(deleteRecordInputSchema)
    .mutation(({ input }) => deleteMaintenanceRecord(input)),

  // Upcoming service routes
  createUpcomingService: publicProcedure
    .input(createUpcomingServiceInputSchema)
    .mutation(({ input }) => createUpcomingService(input)),
  
  getUpcomingServices: publicProcedure
    .query(() => getUpcomingServices()),
  
  getUpcomingServicesByCarId: publicProcedure
    .input(getUpcomingServicesByCarInputSchema)
    .query(({ input }) => getUpcomingServicesByCarId(input)),
  
  updateUpcomingService: publicProcedure
    .input(updateUpcomingServiceInputSchema)
    .mutation(({ input }) => updateUpcomingService(input)),
  
  deleteUpcomingService: publicProcedure
    .input(deleteRecordInputSchema)
    .mutation(({ input }) => deleteUpcomingService(input)),
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
