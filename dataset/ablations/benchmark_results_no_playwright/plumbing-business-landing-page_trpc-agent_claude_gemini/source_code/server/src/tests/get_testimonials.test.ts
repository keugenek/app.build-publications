import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { testimonialsTable } from '../db/schema';
import { type Testimonial } from '../schema';
import { getTestimonials } from '../handlers/get_testimonials';

// Test data for testimonials
const testTestimonials = [
  {
    customer_name: 'John Smith',
    rating: 5,
    testimonial_text: 'Excellent plumbing service! Fixed my leak quickly and professionally.',
    service_type: 'Emergency Repair',
    display_order: 2
  },
  {
    customer_name: 'Sarah Johnson',
    rating: 4,
    testimonial_text: 'Great work on our bathroom renovation. Very satisfied with the results.',
    service_type: 'Bathroom Renovation',
    display_order: 1
  },
  {
    customer_name: 'Mike Wilson',
    rating: 5,
    testimonial_text: 'Reliable and affordable plumbing services. Highly recommend!',
    service_type: null, // Testing nullable service_type
    display_order: 3
  }
];

describe('getTestimonials', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no testimonials exist', async () => {
    const result = await getTestimonials();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return testimonials ordered by display_order', async () => {
    // Insert testimonials in random order
    await db.insert(testimonialsTable)
      .values(testTestimonials)
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(3);
    
    // Verify they are ordered by display_order (1, 2, 3)
    expect(result[0].customer_name).toEqual('Sarah Johnson');
    expect(result[0].display_order).toEqual(1);
    
    expect(result[1].customer_name).toEqual('John Smith');
    expect(result[1].display_order).toEqual(2);
    
    expect(result[2].customer_name).toEqual('Mike Wilson');
    expect(result[2].display_order).toEqual(3);
  });

  it('should return all testimonial fields correctly', async () => {
    // Insert single testimonial for detailed field testing
    await db.insert(testimonialsTable)
      .values([testTestimonials[0]])
      .execute();

    const result = await getTestimonials();
    const testimonial = result[0];

    expect(testimonial.id).toBeDefined();
    expect(typeof testimonial.id).toBe('number');
    expect(testimonial.customer_name).toEqual('John Smith');
    expect(testimonial.rating).toEqual(5);
    expect(testimonial.testimonial_text).toEqual('Excellent plumbing service! Fixed my leak quickly and professionally.');
    expect(testimonial.service_type).toEqual('Emergency Repair');
    expect(testimonial.display_order).toEqual(2);
    expect(testimonial.created_at).toBeInstanceOf(Date);
  });

  it('should handle nullable service_type field', async () => {
    // Insert testimonial with null service_type
    await db.insert(testimonialsTable)
      .values([testTestimonials[2]]) // Mike Wilson has null service_type
      .execute();

    const result = await getTestimonials();
    const testimonial = result[0];

    expect(testimonial.customer_name).toEqual('Mike Wilson');
    expect(testimonial.service_type).toBeNull();
    expect(testimonial.rating).toEqual(5);
  });

  it('should handle multiple testimonials with same display_order', async () => {
    // Create testimonials with same display_order to test consistent ordering
    const duplicateOrderTestimonials = [
      {
        customer_name: 'Customer A',
        rating: 5,
        testimonial_text: 'Great service A',
        service_type: 'Service A',
        display_order: 1
      },
      {
        customer_name: 'Customer B',
        rating: 4,
        testimonial_text: 'Great service B',
        service_type: 'Service B',
        display_order: 1
      }
    ];

    await db.insert(testimonialsTable)
      .values(duplicateOrderTestimonials)
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(2);
    // Both should have display_order of 1
    expect(result[0].display_order).toEqual(1);
    expect(result[1].display_order).toEqual(1);
    
    // Results should be consistent (database will determine internal ordering)
    const customerNames = result.map(t => t.customer_name).sort();
    expect(customerNames).toEqual(['Customer A', 'Customer B']);
  });

  it('should handle various rating values', async () => {
    const ratingTestimonials = [
      {
        customer_name: 'One Star Customer',
        rating: 1,
        testimonial_text: 'Could be better',
        service_type: 'Basic Service',
        display_order: 1
      },
      {
        customer_name: 'Five Star Customer',
        rating: 5,
        testimonial_text: 'Outstanding service!',
        service_type: 'Premium Service',
        display_order: 2
      }
    ];

    await db.insert(testimonialsTable)
      .values(ratingTestimonials)
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(2);
    expect(result[0].rating).toEqual(1);
    expect(result[1].rating).toEqual(5);
    
    // Verify rating values are numbers
    result.forEach(testimonial => {
      expect(typeof testimonial.rating).toBe('number');
      expect(testimonial.rating).toBeGreaterThanOrEqual(1);
      expect(testimonial.rating).toBeLessThanOrEqual(5);
    });
  });

  it('should handle large dataset efficiently', async () => {
    // Create multiple testimonials to test performance
    const largeDataset = Array.from({ length: 50 }, (_, index) => ({
      customer_name: `Customer ${index + 1}`,
      rating: (index % 5) + 1, // Ratings 1-5
      testimonial_text: `Testimonial text for customer ${index + 1}`,
      service_type: index % 3 === 0 ? null : `Service Type ${index % 3}`,
      display_order: index + 1
    }));

    await db.insert(testimonialsTable)
      .values(largeDataset)
      .execute();

    const result = await getTestimonials();

    expect(result).toHaveLength(50);
    
    // Verify ordering is correct for large dataset
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].display_order).toBeLessThanOrEqual(result[i + 1].display_order);
    }
    
    // Verify first and last items
    expect(result[0].display_order).toEqual(1);
    expect(result[49].display_order).toEqual(50);
  });
});
