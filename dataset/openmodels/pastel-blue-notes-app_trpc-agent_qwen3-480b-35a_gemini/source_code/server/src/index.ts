import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createFolderInputSchema,
  createNoteInputSchema,
  updateNoteInputSchema,
  updateFolderInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { createFolder } from './handlers/create_folder';
import { createNote } from './handlers/create_note';
import { updateNote } from './handlers/update_note';
import { deleteNote } from './handlers/delete_note';
import { getUserNotes } from './handlers/get_user_notes';
import { getFolderNotes } from './handlers/get_folder_notes';
import { getUserFolders } from './handlers/get_user_folders';
import { updateFolder } from './handlers/update_folder';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User procedures
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
    
  // Folder procedures
  createFolder: publicProcedure
    .input(createFolderInputSchema)
    .mutation(({ input }) => createFolder(input)),
    
  getUserFolders: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserFolders(input.userId)),
    
  updateFolder: publicProcedure
    .input(updateFolderInputSchema)
    .mutation(({ input }) => updateFolder(input)),
    
  // Note procedures
  createNote: publicProcedure
    .input(createNoteInputSchema)
    .mutation(({ input }) => createNote(input)),
    
  getUserNotes: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUserNotes(input.userId)),
    
  getFolderNotes: publicProcedure
    .input(z.object({ folderId: z.number() }))
    .query(({ input }) => getFolderNotes(input.folderId)),
    
  updateNote: publicProcedure
    .input(updateNoteInputSchema)
    .mutation(({ input }) => updateNote(input)),
    
  deleteNote: publicProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(({ input }) => deleteNote(input.noteId)),
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
