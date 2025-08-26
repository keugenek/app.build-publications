import './App.css';
import { ServiceList } from '@/components/ServiceList';
import { TestimonialList } from '@/components/TestimonialList';
import { ContactForm } from '@/components/ContactForm';

function App() {
  return (
    <div>
      <header className="bg-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Reliable Plumbing Services</h1>
          <p className="text-lg mb-6">Fast, affordable, and professional plumbing solutions for your home and business.</p>
          <a href="#contact" className="inline-block bg-white text-blue-600 font-semibold py-2 px-4 rounded hover:bg-gray-100">Get a Free Quote</a>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">Our Services</h2>
          <ServiceList />
        </section>
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4 text-center">What Our Customers Say</h2>
          <TestimonialList />
        </section>
        <section id="contact" className="max-w-lg mx-auto">
          <h2 className="text-2xl font-semibold mb-4 text-center">Contact Us</h2>
          <ContactForm />
        </section>
      </main>
      <footer className="bg-gray-800 text-gray-200 py-4 text-center">
        <p>© 2025 Reliable Plumbing. All rights reserved.</p>
      </footer>
      <div className="grid"></div>
      <div className="container">
        <h1 className="title">Under Construction</h1>
        <p className="description">
          Your app is under construction. It's being built right now!
        </p>
        <div className="dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <footer className="footer">
          Built with ❤️ by{" "}
          <a href="https://app.build" target="_blank" className="footer-link">
            app.build
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
