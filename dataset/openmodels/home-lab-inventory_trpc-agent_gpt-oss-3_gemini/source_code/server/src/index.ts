import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Handlers
import { createHardwareAsset } from './handlers/create_hardware_asset';
import { getHardwareAssets as getHardwareAssetsHandler } from './handlers/get_hardware_assets';
import { createSoftwareAsset } from './handlers/create_software_asset';
import { getSoftwareAssets as getSoftwareAssetsHandler } from './handlers/get_software_assets';
import { createIPAllocation } from './handlers/create_ip_allocation';
import { getIPAllocations } from './handlers/get_ip_allocations';

// Schemas for input validation
import { createHardwareAssetInputSchema, createSoftwareAssetInputSchema, createIPAllocationInputSchema } from './schema';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Hardware asset routes
  createHardwareAsset: publicProcedure
    .input(createHardwareAssetInputSchema)
    .mutation(({ input }) => createHardwareAsset(input)),
  getHardwareAssets: publicProcedure.query(() => getHardwareAssetsHandler()),

  // Software asset routes
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),
  getSoftwareAssets: publicProcedure.query(() => getSoftwareAssetsHandler()),

  // IP allocation routes
  createIPAllocation: publicProcedure
    .input(createIPAllocationInputSchema)
    .mutation(({ input }) => createIPAllocation(input)),
  getIPAllocations: publicProcedure.query(() => getIPAllocations()),

  // Healthcheck
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
