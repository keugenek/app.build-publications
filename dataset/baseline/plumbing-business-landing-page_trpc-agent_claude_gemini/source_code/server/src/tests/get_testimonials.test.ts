import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { getTestimonials, getFeaturedTestimonials } from '../handlers/get_testimonials';

describe('getTestimonials', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return all testimonials ordered by creation date (newest first)', async () => {
        // Create test testimonials with different timestamps
        const testimonials = [
            {
                customer_name: 'John Doe',
                customer_location: 'Seattle, WA',
                rating: 5,
                review_text: 'Excellent service! Fixed my plumbing issue quickly.',
                service_type: 'Emergency Repair',
                is_featured: false
            },
            {
                customer_name: 'Jane Smith',
                customer_location: 'Portland, OR',
                rating: 4,
                review_text: 'Very professional and reliable technicians.',
                service_type: 'Maintenance',
                is_featured: true
            },
            {
                customer_name: 'Mike Johnson',
                customer_location: null,
                rating: 5,
                review_text: 'Outstanding work on bathroom renovation.',
                service_type: null,
                is_featured: false
            }
        ];

        // Insert testimonials with slight delays to ensure different timestamps
        for (let i = 0; i < testimonials.length; i++) {
            await db.insert(testimonialsTable)
                .values(testimonials[i])
                .execute();
            
            // Small delay to ensure different created_at timestamps
            if (i < testimonials.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const results = await getTestimonials();

        expect(results).toHaveLength(3);
        
        // Verify all testimonials are returned
        expect(results.some(t => t.customer_name === 'John Doe')).toBe(true);
        expect(results.some(t => t.customer_name === 'Jane Smith')).toBe(true);
        expect(results.some(t => t.customer_name === 'Mike Johnson')).toBe(true);

        // Verify ordering (newest first)
        for (let i = 0; i < results.length - 1; i++) {
            expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
        }

        // Verify data integrity
        results.forEach(testimonial => {
            expect(testimonial.id).toBeDefined();
            expect(testimonial.customer_name).toBeDefined();
            expect(testimonial.rating).toBeGreaterThanOrEqual(1);
            expect(testimonial.rating).toBeLessThanOrEqual(5);
            expect(testimonial.review_text).toBeDefined();
            expect(testimonial.created_at).toBeInstanceOf(Date);
            expect(typeof testimonial.is_featured).toBe('boolean');
        });
    });

    it('should return empty array when no testimonials exist', async () => {
        const results = await getTestimonials();
        expect(results).toHaveLength(0);
        expect(Array.isArray(results)).toBe(true);
    });

    it('should handle testimonials with null optional fields', async () => {
        await db.insert(testimonialsTable)
            .values({
                customer_name: 'Test Customer',
                customer_location: null,
                rating: 3,
                review_text: 'Average service, could be better.',
                service_type: null,
                is_featured: false
            })
            .execute();

        const results = await getTestimonials();

        expect(results).toHaveLength(1);
        expect(results[0].customer_name).toEqual('Test Customer');
        expect(results[0].customer_location).toBeNull();
        expect(results[0].service_type).toBeNull();
        expect(results[0].rating).toEqual(3);
    });
});

describe('getFeaturedTestimonials', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    it('should return only featured testimonials ordered by creation date', async () => {
        // Create mix of featured and non-featured testimonials
        const testimonials = [
            {
                customer_name: 'Featured Customer 1',
                customer_location: 'Seattle, WA',
                rating: 5,
                review_text: 'Amazing service! Highly recommended.',
                service_type: 'Installation',
                is_featured: true
            },
            {
                customer_name: 'Regular Customer',
                customer_location: 'Portland, OR',
                rating: 4,
                review_text: 'Good service overall.',
                service_type: 'Repair',
                is_featured: false
            },
            {
                customer_name: 'Featured Customer 2',
                customer_location: 'Tacoma, WA',
                rating: 5,
                review_text: 'Exceptional quality and professionalism.',
                service_type: 'Emergency',
                is_featured: true
            }
        ];

        // Insert testimonials with delays to ensure different timestamps
        for (let i = 0; i < testimonials.length; i++) {
            await db.insert(testimonialsTable)
                .values(testimonials[i])
                .execute();
            
            if (i < testimonials.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        const results = await getFeaturedTestimonials();

        // Should only return featured testimonials
        expect(results).toHaveLength(2);
        expect(results.every(t => t.is_featured === true)).toBe(true);

        // Verify correct testimonials are returned
        expect(results.some(t => t.customer_name === 'Featured Customer 1')).toBe(true);
        expect(results.some(t => t.customer_name === 'Featured Customer 2')).toBe(true);
        expect(results.some(t => t.customer_name === 'Regular Customer')).toBe(false);

        // Verify ordering (newest first)
        for (let i = 0; i < results.length - 1; i++) {
            expect(results[i].created_at >= results[i + 1].created_at).toBe(true);
        }

        // Verify data integrity
        results.forEach(testimonial => {
            expect(testimonial.id).toBeDefined();
            expect(testimonial.customer_name).toBeDefined();
            expect(testimonial.rating).toBeGreaterThanOrEqual(1);
            expect(testimonial.rating).toBeLessThanOrEqual(5);
            expect(testimonial.review_text).toBeDefined();
            expect(testimonial.created_at).toBeInstanceOf(Date);
            expect(testimonial.is_featured).toBe(true);
        });
    });

    it('should return empty array when no featured testimonials exist', async () => {
        // Create only non-featured testimonials
        await db.insert(testimonialsTable)
            .values({
                customer_name: 'Regular Customer',
                customer_location: 'Seattle, WA',
                rating: 4,
                review_text: 'Decent service.',
                service_type: 'Repair',
                is_featured: false
            })
            .execute();

        const results = await getFeaturedTestimonials();
        expect(results).toHaveLength(0);
        expect(Array.isArray(results)).toBe(true);
    });

    it('should return empty array when no testimonials exist at all', async () => {
        const results = await getFeaturedTestimonials();
        expect(results).toHaveLength(0);
        expect(Array.isArray(results)).toBe(true);
    });

    it('should handle featured testimonials with null optional fields', async () => {
        await db.insert(testimonialsTable)
            .values({
                customer_name: 'Featured Customer',
                customer_location: null,
                rating: 5,
                review_text: 'Excellent work despite minimal details provided.',
                service_type: null,
                is_featured: true
            })
            .execute();

        const results = await getFeaturedTestimonials();

        expect(results).toHaveLength(1);
        expect(results[0].customer_name).toEqual('Featured Customer');
        expect(results[0].customer_location).toBeNull();
        expect(results[0].service_type).toBeNull();
        expect(results[0].rating).toEqual(5);
        expect(results[0].is_featured).toBe(true);
    });
});
