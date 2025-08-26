import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createHardwareAssetInputSchema, 
  updateHardwareAssetInputSchema,
  createSoftwareAssetInputSchema,
  updateSoftwareAssetInputSchema,
  createIPAddressInputSchema,
  updateIPAddressInputSchema
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

import { createIPAddress } from './handlers/create_ip_address';
import { getIPAddresses } from './handlers/get_ip_addresses';
import { getIPAddress } from './handlers/get_ip_address';
import { updateIPAddress } from './handlers/update_ip_address';
import { deleteIPAddress } from './handlers/delete_ip_address';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
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
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getHardwareAsset(input.id)),
  updateHardwareAsset: publicProcedure
    .input(updateHardwareAssetInputSchema)
    .mutation(({ input }) => updateHardwareAsset(input)),
  deleteHardwareAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteHardwareAsset(input.id)),
    
  // Software Asset routes
  createSoftwareAsset: publicProcedure
    .input(createSoftwareAssetInputSchema)
    .mutation(({ input }) => createSoftwareAsset(input)),
  getSoftwareAssets: publicProcedure
    .query(() => getSoftwareAssets()),
  getSoftwareAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSoftwareAsset(input.id)),
  updateSoftwareAsset: publicProcedure
    .input(updateSoftwareAssetInputSchema)
    .mutation(({ input }) => updateSoftwareAsset(input)),
  deleteSoftwareAsset: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteSoftwareAsset(input.id)),
    
  // IP Address routes
  createIPAddress: publicProcedure
    .input(createIPAddressInputSchema)
    .mutation(({ input }) => createIPAddress(input)),
  getIPAddresses: publicProcedure
    .query(() => getIPAddresses()),
  getIPAddress: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getIPAddress(input.id)),
  updateIPAddress: publicProcedure
    .input(updateIPAddressInputSchema)
    .mutation(({ input }) => updateIPAddress(input)),
  deleteIPAddress: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteIPAddress(input.id)),
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
