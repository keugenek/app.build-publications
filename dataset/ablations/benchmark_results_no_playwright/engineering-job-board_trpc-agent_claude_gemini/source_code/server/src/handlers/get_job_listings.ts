import { db } from '../db';
import { jobListingsTable } from '../db/schema';
import { type GetJobListingsInput, type PaginatedJobListings } from '../schema';
import { eq, and, ilike, or, count, desc, type SQL } from 'drizzle-orm';

export async function getJobListings(input: GetJobListingsInput): Promise<PaginatedJobListings> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by engineering discipline
    if (input.engineering_discipline) {
      conditions.push(eq(jobListingsTable.engineering_discipline, input.engineering_discipline));
    }

    // Filter by location (partial match, case insensitive)
    if (input.location) {
      conditions.push(ilike(jobListingsTable.location, `%${input.location}%`));
    }

    // Filter by remote friendly
    if (input.remote_friendly !== undefined) {
      conditions.push(eq(jobListingsTable.remote_friendly, input.remote_friendly));
    }

    // Filter by employment type
    if (input.employment_type) {
      conditions.push(eq(jobListingsTable.employment_type, input.employment_type));
    }

    // Search query across title, company name, and description
    if (input.search_query && input.search_query.trim() !== '') {
      const searchTerm = `%${input.search_query}%`;
      const searchCondition = or(
        ilike(jobListingsTable.title, searchTerm),
        ilike(jobListingsTable.company_name, searchTerm),
        ilike(jobListingsTable.description, searchTerm)
      );
      if (searchCondition) {
        conditions.push(searchCondition);
      }
    }

    // Calculate offset for pagination
    const offset = (input.page - 1) * input.limit;

    // Build and execute data query
    const jobListings = conditions.length > 0
      ? await db.select()
          .from(jobListingsTable)
          .where(conditions.length === 1 ? conditions[0]! : and(...conditions))
          .orderBy(desc(jobListingsTable.created_at))
          .limit(input.limit)
          .offset(offset)
          .execute()
      : await db.select()
          .from(jobListingsTable)
          .orderBy(desc(jobListingsTable.created_at))
          .limit(input.limit)
          .offset(offset)
          .execute();

    // Build and execute count query
    const totalResult = conditions.length > 0
      ? await db.select({ count: count() })
          .from(jobListingsTable)
          .where(conditions.length === 1 ? conditions[0]! : and(...conditions))
          .execute()
      : await db.select({ count: count() })
          .from(jobListingsTable)
          .execute();

    const total = totalResult[0].count;

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / input.limit);

    return {
      data: jobListings,
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages
      }
    };
  } catch (error) {
    console.error('Failed to retrieve job listings:', error);
    throw error;
  }
}
