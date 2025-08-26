import { initTRPC } from '@trpc/server';
import { createPlantInputSchema, updatePlantInputSchema } from './schema';
import { createPlant } from './handlers/create_plant';
import { getPlants } from './handlers/get_plants';
import { updatePlant } from './handlers/update_plant';
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
  // Plant management routes
  createPlant: publicProcedure
    .input(createPlantInputSchema)
    .mutation(({ input }) => createPlant(input)),
  getPlants: publicProcedure.query(() => getPlants()),
  updatePlant: publicProcedure
    .input(updatePlantInputSchema)
    .mutation(({ input }) => updatePlant(input)),

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
