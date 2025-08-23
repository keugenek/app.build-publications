import React from 'react';

function Testimonials() {
  const testimonials = [
    {
      name: 'John Doe',
      comment: 'ProPlumb arrived fast and fixed my leak in no time. Highly recommend!'
    },
    {
      name: 'Sarah Lee',
      comment: 'Excellent service and friendly technicians. Our drains have never been cleaner.'
    },
    {
      name: 'Mike Johnson',
      comment: 'Professional, punctual, and affordable. Best plumbing service in town.'
    }
  ];

  return (
    <section className="bg-gray-50 py-12" id="testimonials">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <p className="text-gray-800 mb-4">{t.comment}</p>
              <p className="text-sm font-semibold text-primary">- {t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
