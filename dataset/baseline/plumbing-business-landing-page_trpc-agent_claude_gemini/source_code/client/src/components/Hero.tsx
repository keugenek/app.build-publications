import { Button } from '@/components/ui/button';
import { Phone, Clock, Shield } from 'lucide-react';

export function Hero() {
  const scrollToContact = () => {
    const contactSection = document.getElementById('contact');
    contactSection?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    const servicesSection = document.getElementById('services');
    servicesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative container mx-auto px-4 py-20 lg:py-28">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Professional Plumbing Services
            <span className="block text-blue-200">You Can Trust</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            24/7 emergency service, licensed professionals, and guaranteed quality work. 
            From leaky faucets to complete pipe installations, we've got you covered.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={scrollToContact}
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold shadow-lg"
            >
              Get Free Quote
            </Button>
            <Button 
              onClick={scrollToServices}
              variant="outline" 
              size="lg" 
              className="border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold"
            >
              View Services
            </Button>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-center space-x-3 text-blue-100">
              <Phone className="h-6 w-6 text-orange-400" />
              <span className="font-semibold">24/7 Emergency Service</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-blue-100">
              <Shield className="h-6 w-6 text-orange-400" />
              <span className="font-semibold">Licensed & Insured</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-blue-100">
              <Clock className="h-6 w-6 text-orange-400" />
              <span className="font-semibold">Same Day Service</span>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact Banner */}
      <div className="bg-red-600 py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="text-white font-semibold">
            🚨 EMERGENCY? Call Now: 
            <a href="tel:+1-555-PLUMBER" className="ml-2 text-yellow-300 hover:text-yellow-200 font-bold">
              (555) PLUMBER
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
