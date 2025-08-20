import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Schema imports
import { 
  createCarInputSchema, 
  updateCarInputSchema,
  createMaintenanceRecordInputSchema,
  updateMaintenanceRecordInputSchema,
  createUpcomingServiceInputSchema,
  updateUpcomingServiceInputSchema
} from './schema';

// Handler imports
import { createCar } from './handlers/create_car';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';
import { getCars } from './handlers/get_cars';
import { createMaintenanceRecord } from './handlers/create_maintenance_record';
import { updateMaintenanceRecord } from './handlers/update_maintenance_record';
import { deleteMaintenanceRecord } from './handlers/delete_maintenance_record';
import { getMaintenanceRecords } from './handlers/get_maintenance_records';
import { createUpcomingService } from './handlers/create_upcoming_service';
import { updateUpcomingService } from './handlers/update_upcoming_service';
import { deleteUpcomingService } from './handlers/delete_upcoming_service';
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
  
  // Car endpoints
  createCar: publicProcedure
    .input(createCarInputSchema)
    .mutation(({ input }) => createCar(input)),
  getCars: publicProcedure
    .query(() => getCars()),
  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),
  deleteCar: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCar(input)),
  
  // Maintenance record endpoints
  createMaintenanceRecord: publicProcedure
    .input(createMaintenanceRecordInputSchema)
    .mutation(({ input }) => createMaintenanceRecord(input)),
  getMaintenanceRecords: publicProcedure
    .input(z.number())
    .query(({ input }) => getMaintenanceRecords(input)),
  updateMaintenanceRecord: publicProcedure
    .input(updateMaintenanceRecordInputSchema)
    .mutation(({ input }) => updateMaintenanceRecord(input)),
  deleteMaintenanceRecord: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteMaintenanceRecord(input)),
  
  // Upcoming service endpoints
  createUpcomingService: publicProcedure
    .input(createUpcomingServiceInputSchema)
    .mutation(({ input }) => createUpcomingService(input)),
  getUpcomingServices: publicProcedure
    .input(z.number())
    .query(({ input }) => getUpcomingServices(input)),
  updateUpcomingService: publicProcedure
    .input(updateUpcomingServiceInputSchema)
    .mutation(({ input }) => updateUpcomingService(input)),
  deleteUpcomingService: publicProcedure
    .input(z.number())
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
