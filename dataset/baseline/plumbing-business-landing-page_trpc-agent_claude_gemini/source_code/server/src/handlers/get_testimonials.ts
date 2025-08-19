import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { desc, eq } from 'drizzle-orm';

export async function getTestimonials(): Promise<Testimonial[]> {
    try {
        const results = await db.select()
            .from(testimonialsTable)
            .orderBy(desc(testimonialsTable.created_at))
            .execute();

        return results;
    } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        throw error;
    }
}

export async function getFeaturedTestimonials(): Promise<Testimonial[]> {
    try {
        const results = await db.select()
            .from(testimonialsTable)
            .where(eq(testimonialsTable.is_featured, true))
            .orderBy(desc(testimonialsTable.created_at))
            .execute();

        return results;
    } catch (error) {
        console.error('Failed to fetch featured testimonials:', error);
        throw error;
    }
}
