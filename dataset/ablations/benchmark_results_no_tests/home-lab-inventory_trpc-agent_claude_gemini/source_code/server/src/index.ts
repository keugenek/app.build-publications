import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import {
  createHardwareAssetInputSchema,
  updateHardwareAssetInputSchema,
  createSoftwareAssetInputSchema,
  updateSoftwareAssetInputSchema,
  createIpAddressInputSchema,
  updateIpAddressInputSchema,
  idInputSchema
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

import { createIpAddress } from './handlers/create_ip_address';
import { getIpAddresses } from './handlers/get_ip_addresses';
import { getIpAddress } from './handlers/get_ip_address';
import { updateIpAddress } from './handlers/update_ip_address';
import { deleteIpAddress } from './handlers/delete_ip_address';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Hardware Asset routes
  createHardwareAsset: publicProcedure
    .input(createHardwareAssetInputSchema)
    .mutation(({ input }) => createHardwareAsset(input)),
  
  getHardwareAssets: publicProcedure
    .query(() => getHardwareAssets()),
  
  getHardwareAsset: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getHardwareAsset(input)),
  
  updateHardwareAsset: publicProcedure
    .input(updateHardwareAssetInputSchema)
    .mutation(({ input }) => updateHardwareAsset(input)),
  
  deleteHardwareAsset: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteHardwareAsset(input)),

  // Software Asset routes
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),
  
  getSoftwareAssets: publicProcedure
    .query(() => getSoftwareAssets()),
  
  getSoftwareAsset: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getSoftwareAsset(input)),
  
  updateSoftwareAsset: publicProcedure
    .input(updateSoftwareAssetInputSchema)
    .mutation(({ input }) => updateSoftwareAsset(input)),
  
  deleteSoftwareAsset: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteSoftwareAsset(input)),

  // IP Address routes
  createIpAddress: publicProcedure
    .input(createIpAddressInputSchema)
    .mutation(({ input }) => createIpAddress(input)),
  
  getIpAddresses: publicProcedure
    .query(() => getIpAddresses()),
  
  getIpAddress: publicProcedure
    .input(idInputSchema)
    .query(({ input }) => getIpAddress(input)),
  
  updateIpAddress: publicProcedure
    .input(updateIpAddressInputSchema)
    .mutation(({ input }) => updateIpAddress(input)),
  
  deleteIpAddress: publicProcedure
    .input(idInputSchema)
    .mutation(({ input }) => deleteIpAddress(input)),
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
