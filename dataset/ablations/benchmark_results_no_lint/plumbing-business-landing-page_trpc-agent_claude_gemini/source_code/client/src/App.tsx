import { useRef } from 'react';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';

function App() {
  const contactRef = useRef<HTMLElement>(null);

  const scrollToContact = () => {
    contactRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-blue-800">
              🔧 Pro Plumbing Services
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#services" className="text-gray-700 hover:text-blue-600 transition-colors">
                Services
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">
                Reviews
              </a>
              <button 
                onClick={scrollToContact}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded transition-colors"
              >
                Contact Us
              </button>
            </div>
            <div className="md:hidden">
              <button 
                onClick={scrollToContact}
                className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm"
              >
                Contact
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Add padding to account for fixed navbar */}
      <div className="pt-16">
        {/* Hero Section */}
        <HeroSection onContactClick={scrollToContact} />

        {/* Services Section */}
        <section id="services">
          <ServicesSection />
        </section>

        {/* Testimonials Section */}
        <section id="testimonials">
          <TestimonialsSection />
        </section>

        {/* Contact Section */}
        <section ref={contactRef}>
          <ContactSection />
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default App;
