import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  createPlantInputSchema, 
  updatePlantInputSchema, 
  deletePlantInputSchema 
} from './schema';

// Import handlers
import { createPlant } from './handlers/create_plant';
import { getPlants } from './handlers/get_plants';
import { updatePlant } from './handlers/update_plant';
import { deletePlant } from './handlers/delete_plant';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new plant
  createPlant: publicProcedure
    .input(createPlantInputSchema)
    .mutation(({ input }) => createPlant(input)),
  
  // Get all plants with their current moods
  getPlants: publicProcedure
    .query(() => getPlants()),
  
  // Update an existing plant
  updatePlant: publicProcedure
    .input(updatePlantInputSchema)
    .mutation(({ input }) => updatePlant(input)),
  
  // Delete a plant
  deletePlant: publicProcedure
    .input(deletePlantInputSchema)
    .mutation(({ input }) => deletePlant(input)),
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
