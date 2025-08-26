import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas for input validation
import {
  createHardwareAssetInputSchema,
  updateHardwareAssetInputSchema,
  deleteHardwareAssetInputSchema,
  createSoftwareAssetInputSchema,
  updateSoftwareAssetInputSchema,
  deleteSoftwareAssetInputSchema,
  createIPAllocationInputSchema,
  updateIPAllocationInputSchema,
  deleteIPAllocationInputSchema,
} from './schema';

// Import handler functions (dummy implementations)
import {
  createHardwareAsset,
  getHardwareAssets,
  updateHardwareAsset,
  deleteHardwareAsset,
} from './handlers/hardware';
import {
  createSoftwareAsset,
  getSoftwareAssets,
  updateSoftwareAsset,
  deleteSoftwareAsset,
} from './handlers/software';
import {
  createIPAllocation,
  getIPAllocations,
  updateIPAllocation,
  deleteIPAllocation,
} from './handlers/ipAllocation';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Hardware Asset CRUD
  createHardwareAsset: publicProcedure
    .input(createHardwareAssetInputSchema)
    .mutation(({ input }) => createHardwareAsset(input)),
  getHardwareAssets: publicProcedure.query(() => getHardwareAssets()),
  updateHardwareAsset: publicProcedure
    .input(updateHardwareAssetInputSchema)
    .mutation(({ input }) => updateHardwareAsset(input)),
  deleteHardwareAsset: publicProcedure
    .input(deleteHardwareAssetInputSchema)
    .mutation(({ input }) => deleteHardwareAsset(input)),

  // Software Asset CRUD
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),
  getSoftwareAssets: publicProcedure.query(() => getSoftwareAssets()),
  updateSoftwareAsset: publicProcedure
    .input(updateSoftwareAssetInputSchema)
    .mutation(({ input }) => updateSoftwareAsset(input)),
  deleteSoftwareAsset: publicProcedure
    .input(deleteSoftwareAssetInputSchema)
    .mutation(({ input }) => deleteSoftwareAsset(input)),

  // IP Allocation CRUD
  createIPAllocation: publicProcedure
    .input(createIPAllocationInputSchema)
    .mutation(({ input }) => createIPAllocation(input)),
  getIPAllocations: publicProcedure.query(() => getIPAllocations()),
  updateIPAllocation: publicProcedure
    .input(updateIPAllocationInputSchema)
    .mutation(({ input }) => updateIPAllocation(input)),
  deleteIPAllocation: publicProcedure
    .input(deleteIPAllocationInputSchema)
    .mutation(({ input }) => deleteIPAllocation(input)),
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
