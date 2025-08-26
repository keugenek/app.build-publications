import { pgTable, serial, text } from 'drizzle-orm/pg-core';

// No persistent tables needed for this simple weather suggestion service.
// Export an empty tables object to satisfy Drizzle relation queries.
export const tables = {};
