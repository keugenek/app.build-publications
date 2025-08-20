import { pgTable } from 'drizzle-orm/pg-core';

// No persistent tables required for the weather forecast service.
// Export an empty tables object to satisfy drizzle relation queries.
export const tables = {};
