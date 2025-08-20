import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { createPlantInputSchema, updatePlantInputSchema, waterPlantInputSchema } from './schema';
import { createPlant } from './handlers/create_plant';
import { getPlants } from './handlers/get_plants';
import { waterPlant } from './handlers/water_plant';
import { updatePlant } from './handlers/update_plant';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  createPlant: publicProcedure
    .input(createPlantInputSchema)
    .mutation(({ input }) => createPlant(input)),
  getPlants: publicProcedure
    .query(() => getPlants()),
  updatePlant: publicProcedure
    .input(updatePlantInputSchema)
    .mutation(({ input }) => updatePlant(input)),
  waterPlant: publicProcedure
    .input(updatePlantInputSchema)
    .mutation(({ input }) => waterPlant(input)),
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
