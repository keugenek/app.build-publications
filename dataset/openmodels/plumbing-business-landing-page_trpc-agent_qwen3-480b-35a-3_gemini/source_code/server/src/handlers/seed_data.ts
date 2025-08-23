import { db } from '../db';
import { servicesTable, testimonialsTable } from '../db/schema';

export const seedData = async (): Promise<{ success: boolean; message: string }> => {
  try {
    // Clear existing data
    await db.delete(testimonialsTable);
    await db.delete(servicesTable);

    // Insert sample services
    const services = [
      {
        title: 'Emergency Plumbing',
        description: '24/7 emergency plumbing services for urgent repairs and leaks. Our expert plumbers are ready to respond to your emergency at any time.',
        icon: null
      },
      {
        title: 'Leak Detection',
        description: 'Advanced leak detection using state-of-the-art equipment to find hidden leaks without damaging your property.',
        icon: null
      },
      {
        title: 'Pipe Repair & Replacement',
        description: 'Professional pipe repair and replacement services for all types of pipes including copper, PVC, and galvanized.',
        icon: null
      },
      {
        title: 'Water Heater Services',
        description: 'Installation, repair, and maintenance of tankless and traditional water heaters for residential and commercial properties.',
        icon: null
      },
      {
        title: 'Drain Cleaning',
        description: 'Expert drain cleaning services to remove clogs and restore proper drainage in your home or business.',
        icon: null
      },
      {
        title: 'Bathroom Remodeling',
        description: 'Complete bathroom remodeling services including plumbing fixture installation and upgrades.',
        icon: null
      }
    ];

    for (const service of services) {
      await db.insert(servicesTable).values(service);
    }

    // Insert sample testimonials
    const testimonials = [
      {
        customer_name: 'John Smith',
        customer_position: null,
        company_name: null,
        content: 'Quick response and professional service! Fixed our leaking pipe in no time. Highly recommend their emergency services.',
        rating: 5,
        avatar: null
      },
      {
        customer_name: 'Sarah Johnson',
        customer_position: null,
        company_name: null,
        content: 'The plumber arrived on time and was very knowledgeable. They explained everything clearly and the price was fair.',
        rating: 4,
        avatar: null
      },
      {
        customer_name: 'Robert Williams',
        customer_position: null,
        company_name: null,
        content: 'Outstanding service! They replaced our old water heater and even helped us choose the most efficient model for our home.',
        rating: 5,
        avatar: null
      }
    ];

    for (const testimonial of testimonials) {
      await db.insert(testimonialsTable).values(testimonial);
    }

    return {
      success: true,
      message: 'Database seeded successfully!'
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    return {
      success: false,
      message: 'Error seeding database: ' + (error as Error).message
    };
  }
};