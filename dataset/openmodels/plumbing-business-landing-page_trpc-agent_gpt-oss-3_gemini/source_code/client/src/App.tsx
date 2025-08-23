import './App.css';
import { HeroSection } from '@/components/HeroSection';
import { ServicesSection } from '@/components/ServicesSection';
import { TestimonialsSection } from '@/components/TestimonialsSection';
import { ContactSection } from '@/components/ContactSection';

function App() {
  return (
    <div className="font-sans">
      {/* Hero */}
      <HeroSection />
      {/* Services */}
      <ServicesSection />
      {/* Testimonials */}
      <TestimonialsSection />
      {/* Contact Form */}
      <ContactSection />
    </div>
  );
}

export default App;
