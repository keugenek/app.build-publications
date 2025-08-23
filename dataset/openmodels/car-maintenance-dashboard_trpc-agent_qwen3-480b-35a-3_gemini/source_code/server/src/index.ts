import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCarInputSchema,
  updateCarInputSchema,
  createMaintenanceEntryInputSchema,
  updateMaintenanceEntryInputSchema
} from './schema';

// Import car handlers
import { createCar } from './handlers/create_car';
import { getCars } from './handlers/get_cars';
import { getCar } from './handlers/get_car';
import { updateCar } from './handlers/update_car';
import { deleteCar } from './handlers/delete_car';

// Import maintenance entry handlers
import { createMaintenanceEntry } from './handlers/create_maintenance_entry';
import { getMaintenanceEntries } from './handlers/get_maintenance_entries';
import { getMaintenanceEntry } from './handlers/get_maintenance_entry';
import { updateMaintenanceEntry } from './handlers/update_maintenance_entry';
import { deleteMaintenanceEntry } from './handlers/delete_maintenance_entry';

// Import upcoming services handler
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
  
  // Car routes
  createCar: publicProcedure
    .input(createCarInputSchema)
    .mutation(({ input }) => createCar(input)),
  getCars: publicProcedure
    .query(() => getCars()),
  getCar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCar(input.id)),
  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),
  deleteCar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCar(input.id)),
    
  // Maintenance entry routes
  createMaintenanceEntry: publicProcedure
    .input(createMaintenanceEntryInputSchema)
    .mutation(({ input }) => createMaintenanceEntry(input)),
  getMaintenanceEntries: publicProcedure
    .input(z.object({ carId: z.number().optional() }))
    .query(({ input }) => getMaintenanceEntries(input.carId)),
  getMaintenanceEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getMaintenanceEntry(input.id)),
  updateMaintenanceEntry: publicProcedure
    .input(updateMaintenanceEntryInputSchema)
    .mutation(({ input }) => updateMaintenanceEntry(input)),
  deleteMaintenanceEntry: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMaintenanceEntry(input.id)),
    
  // Upcoming services route
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
  console.log(`TRPC server listening at port: ${port}`);
}

start();
