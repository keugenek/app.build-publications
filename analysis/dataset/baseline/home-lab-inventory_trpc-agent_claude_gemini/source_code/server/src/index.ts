import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createHardwareAssetInputSchema,
  updateHardwareAssetInputSchema,
  idParamSchema,
  createSoftwareAssetInputSchema,
  updateSoftwareAssetInputSchema,
  createIpAllocationInputSchema,
  updateIpAllocationInputSchema
} from './schema';

// Import handlers
import { createHardwareAsset } from './handlers/create_hardware_asset';
import { getHardwareAssets } from './handlers/get_hardware_assets';
import { getHardwareAsset } from './handlers/get_hardware_asset';
import { updateHardwareAsset } from './handlers/update_hardware_asset';
import { deleteHardwareAsset } from './handlers/delete_hardware_asset';

import { createSoftwareAsset } from './handlers/create_software_asset';
import { getSoftwareAssets } from './handlers/get_software_assets';
import { getSoftwareAsset } from './handlers/get_software_asset';
import { updateSoftwareAsset } from './handlers/update_software_asset';
import { deleteSoftwareAsset } from './handlers/delete_software_asset';

import { createIpAllocation } from './handlers/create_ip_allocation';
import { getIpAllocations } from './handlers/get_ip_allocations';
import { getIpAllocation } from './handlers/get_ip_allocation';
import { updateIpAllocation } from './handlers/update_ip_allocation';
import { deleteIpAllocation } from './handlers/delete_ip_allocation';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Hardware asset routes
  createHardwareAsset: publicProcedure
    .input(createHardwareAssetInputSchema)
    .mutation(({ input }) => createHardwareAsset(input)),

  getHardwareAssets: publicProcedure
    .query(() => getHardwareAssets()),

  getHardwareAsset: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getHardwareAsset(input)),

  updateHardwareAsset: publicProcedure
    .input(updateHardwareAssetInputSchema)
    .mutation(({ input }) => updateHardwareAsset(input)),

  deleteHardwareAsset: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteHardwareAsset(input)),

  // Software asset routes
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),

  getSoftwareAssets: publicProcedure
    .query(() => getSoftwareAssets()),

  getSoftwareAsset: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getSoftwareAsset(input)),

  updateSoftwareAsset: publicProcedure
    .input(updateSoftwareAssetInputSchema)
    .mutation(({ input }) => updateSoftwareAsset(input)),

  deleteSoftwareAsset: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteSoftwareAsset(input)),

  // IP allocation routes
  createIpAllocation: publicProcedure
    .input(createIpAllocationInputSchema)
    .mutation(({ input }) => createIpAllocation(input)),

  getIpAllocations: publicProcedure
    .query(() => getIpAllocations()),

  getIpAllocation: publicProcedure
    .input(idParamSchema)
    .query(({ input }) => getIpAllocation(input)),

  updateIpAllocation: publicProcedure
    .input(updateIpAllocationInputSchema)
    .mutation(({ input }) => updateIpAllocation(input)),

  deleteIpAllocation: publicProcedure
    .input(idParamSchema)
    .mutation(({ input }) => deleteIpAllocation(input)),
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
