import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import {
  createCarInputSchema,
  updateCarInputSchema,
  createMaintenanceInputSchema,
  updateMaintenanceInputSchema,
} from './schema';
import { createCar, getCars, getCar, updateCar, deleteCar } from './handlers/create_car';
import { createMaintenance, getMaintenancesByCar, updateMaintenance, deleteMaintenance } from './handlers/maintenance_handlers';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Car CRUD
  createCar: publicProcedure
    .input(createCarInputSchema)
    .mutation(({ input }) => createCar(input)),
  getCars: publicProcedure.query(() => getCars()),
  getCar: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getCar(input.id)),
  updateCar: publicProcedure
    .input(updateCarInputSchema)
    .mutation(({ input }) => updateCar(input)),
  deleteCar: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCar(input.id)),
  // Maintenance CRUD
  createMaintenance: publicProcedure
    .input(createMaintenanceInputSchema)
    .mutation(({ input }) => createMaintenance(input)),
  getMaintenancesByCar: publicProcedure
    .input(z.object({ car_id: z.number() }))
    .query(({ input }) => getMaintenancesByCar(input.car_id)),
  updateMaintenance: publicProcedure
    .input(updateMaintenanceInputSchema)
    .mutation(({ input }) => updateMaintenance(input)),
  deleteMaintenance: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteMaintenance(input.id)),

  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
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
