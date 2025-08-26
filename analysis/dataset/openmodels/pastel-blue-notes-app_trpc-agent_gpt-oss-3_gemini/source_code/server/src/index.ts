import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import Zod input schemas
import {
  createUserInputSchema,
  loginInputSchema,
  createFolderInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
} from './schema';

// Import handler functions (dummy implementations)
import { createUser } from './handlers/create_user';
import { login } from './handlers/login';
import { createFolder } from './handlers/create_folder';
import { getFolders } from './handlers/get_folders';
import { createNote } from './handlers/create_note';
import { getNotes } from './handlers/get_notes';
import { updateNote } from './handlers/update_note';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Healthcheck endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  login: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => login(input)),

  // Folder routes
  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(({ input }) => createFolder(input)),
  getFolders: publicProcedure.query(() => getFolders()),

  // Note routes
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),
  getNotes: publicProcedure.query(() => getNotes()),
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),
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
