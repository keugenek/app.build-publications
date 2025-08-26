import React from 'react';

function Services() {
  const services = [
    {
      title: 'Emergency Repairs',
      description: '24/7 fast response for any plumbing emergency.',
      icon: '⏰',
    },
    {
      title: 'Drain Cleaning',
      description: 'Clear clogged drains with professional equipment.',
      icon: '🛁',
    },
    {
      title: 'Water Heater Installation',
      description: 'Energy‑efficient water heater installation and replacement.',
      icon: '🔥',
    },
    {
      title: 'Leak Detection',
      description: 'Locate and fix hidden leaks before they cause damage.',
      icon: '💧',
    },
  ];

  return (
    <section className="bg-white py-12" id="services">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">Our Services</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service) => (
            <div
              key={service.title}
              className="flex flex-col items-center text-center p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="text-4xl mb-4" aria-hidden="true">
                {service.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-600">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
