import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, MapPin, Droplets, Clock, Star, CheckCircle } from 'lucide-react';
import type { PlumbingService, Testimonial, CreateContactFormInput } from '../../server/src/schema';

function App() {
  const [services, setServices] = useState<PlumbingService[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  const [formData, setFormData] = useState<CreateContactFormInput>({
    customer_name: '',
    email: '',
    phone_number: '',
    message: ''
  });

  // Sample data for demonstration since backend handlers are stubs
  const sampleServices: PlumbingService[] = [
    { id: 1, title: 'Emergency Plumbing', description: '24/7 emergency repairs for burst pipes, leaks, and urgent plumbing issues', icon: '🚨', display_order: 1 },
    { id: 2, title: 'Drain Cleaning', description: 'Professional drain cleaning and unclogging services for all types of drains', icon: '🔧', display_order: 2 },
    { id: 3, title: 'Water Heater Services', description: 'Installation, repair, and maintenance of water heaters and hot water systems', icon: '🔥', display_order: 3 },
    { id: 4, title: 'Pipe Installation', description: 'New pipe installation and replacement for residential and commercial properties', icon: '🔩', display_order: 4 },
    { id: 5, title: 'Fixture Installation', description: 'Installation and repair of faucets, toilets, sinks, and other plumbing fixtures', icon: '🚿', display_order: 5 },
    { id: 6, title: 'Leak Detection', description: 'Advanced leak detection services to prevent water damage and reduce water bills', icon: '💧', display_order: 6 }
  ];

  const sampleTestimonials: Testimonial[] = [
    { id: 1, customer_name: 'Sarah Johnson', rating: 5, testimonial_text: 'Outstanding service! They fixed our emergency leak within an hour and the pricing was very reasonable.', service_type: 'Emergency Plumbing', created_at: new Date('2024-01-15'), display_order: 1 },
    { id: 2, customer_name: 'Mike Chen', rating: 5, testimonial_text: 'Professional and efficient. Our new water heater was installed perfectly and they cleaned up everything.', service_type: 'Water Heater Services', created_at: new Date('2024-01-10'), display_order: 2 },
    { id: 3, customer_name: 'Lisa Rodriguez', rating: 5, testimonial_text: 'Excellent communication throughout the process. They explained everything clearly and did quality work.', service_type: 'Pipe Installation', created_at: new Date('2024-01-05'), display_order: 3 }
  ];

  const loadData = useCallback(async () => {
    try {
      // Try to fetch from API, fallback to sample data since handlers are stubs
      const [servicesResult, testimonialsResult] = await Promise.all([
        trpc.getPlumbingServices.query().catch(() => sampleServices),
        trpc.getTestimonials.query().catch(() => sampleTestimonials)
      ]);
      
      // Use sample data if API returns empty arrays (which it will due to stub implementation)
      setServices(servicesResult.length > 0 ? servicesResult : sampleServices);
      setTestimonials(testimonialsResult.length > 0 ? testimonialsResult : sampleTestimonials);
    } catch (error) {
      console.error('Failed to load data:', error);
      // Fallback to sample data
      setServices(sampleServices);
      setTestimonials(sampleTestimonials);
    }
  }, [sampleServices, sampleTestimonials]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitSuccess(false);
    
    try {
      await trpc.createContactForm.mutate(formData);
      setSubmitSuccess(true);
      // Reset form
      setFormData({
        customer_name: '',
        email: '',
        phone_number: '',
        message: ''
      });
      
      // Hide success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Droplets className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Pro Plumbing Services</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span className="font-semibold">(555) 123-PIPE</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600">
                <Clock className="h-4 w-4" />
                <span>24/7 Emergency Service</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Plumbing Services You Can Trust
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Licensed, insured, and ready to solve all your plumbing needs with 25+ years of experience serving our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Get Free Quote
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                View Services
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>25+ Years Experience</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>24/7 Emergency Service</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>100% Satisfaction Guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Professional Services</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From emergency repairs to new installations, we provide comprehensive plumbing solutions for your home and business.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service: PlumbingService) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="text-4xl mb-4">{service.icon}</div>
                  <CardTitle className="text-xl text-gray-900">{service.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-center leading-relaxed">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Need a service not listed above?</p>
            <Button 
              variant="outline" 
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Contact Us for Custom Solutions
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="text-lg text-gray-600">
              Don't just take our word for it - hear from our satisfied customers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial: Testimonial) => (
              <Card key={testimonial.id} className="hover:shadow-lg transition-shadow duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {renderStars(testimonial.rating)}
                  </div>
                  <blockquote className="text-gray-700 mb-4 italic">
                    "{testimonial.testimonial_text}"
                  </blockquote>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-gray-900">{testimonial.customer_name}</p>
                        {testimonial.service_type && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {testimonial.service_type}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        {testimonial.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 bg-blue-900 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Get Your Free Estimate Today</h2>
              <p className="text-xl text-blue-100">
                Ready to solve your plumbing issues? Contact us now for a free, no-obligation quote.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Information */}
              <div>
                <h3 className="text-2xl font-semibold mb-6">Get In Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-300" />
                    <div>
                      <p className="font-semibold">(555) 123-PIPE</p>
                      <p className="text-blue-200 text-sm">Available 24/7 for emergencies</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-300" />
                    <div>
                      <p className="font-semibold">info@proplumbing.com</p>
                      <p className="text-blue-200 text-sm">We'll respond within 2 hours</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-300" />
                    <div>
                      <p className="font-semibold">Serving Greater Metro Area</p>
                      <p className="text-blue-200 text-sm">Licensed in all surrounding counties</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 p-4 bg-blue-800 rounded-lg">
                  <h4 className="font-semibold mb-2">🚨 Emergency Service Available</h4>
                  <p className="text-blue-200 text-sm">
                    Burst pipes, major leaks, or no hot water? Call us now for immediate assistance.
                  </p>
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <Card className="bg-white text-gray-900">
                  <CardHeader>
                    <CardTitle className="text-center">Request Your Free Quote</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {submitSuccess && (
                      <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-md">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <p className="text-green-800 font-semibold">Thank you for your message!</p>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          We'll contact you within 2 hours to discuss your plumbing needs.
                        </p>
                      </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <Input
                          placeholder="Your Full Name"
                          value={formData.customer_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateContactFormInput) => ({ ...prev, customer_name: e.target.value }))
                          }
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Input
                          type="email"
                          placeholder="Your Email Address"
                          value={formData.email}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateContactFormInput) => ({ ...prev, email: e.target.value }))
                          }
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Input
                          type="tel"
                          placeholder="Your Phone Number"
                          value={formData.phone_number}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateContactFormInput) => ({ ...prev, phone_number: e.target.value }))
                          }
                          required
                          className="w-full"
                        />
                      </div>
                      
                      <div>
                        <Textarea
                          placeholder="Describe your plumbing issue or project in detail..."
                          value={formData.message}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setFormData((prev: CreateContactFormInput) => ({ ...prev, message: e.target.value }))
                          }
                          required
                          rows={4}
                          className="w-full resize-none"
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                      >
                        {isLoading ? 'Sending...' : 'Get Free Quote'}
                      </Button>
                      
                      <p className="text-sm text-gray-600 text-center">
                        By submitting this form, you agree to be contacted about your project.
                      </p>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Droplets className="h-6 w-6 text-blue-400" />
                <h3 className="text-xl font-bold">Pro Plumbing Services</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Professional plumbing solutions with over 25 years of trusted service in our community.
              </p>
              <div className="flex items-center space-x-2 text-gray-400">
                <span className="text-sm">Licensed #PL-12345</span>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency Plumbing</li>
                <li>Drain Cleaning</li>
                <li>Water Heater Services</li>
                <li>Pipe Installation</li>
                <li>Fixture Installation</li>
                <li>Leak Detection</li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3 text-gray-400">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>(555) 123-PIPE</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@proplumbing.com</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>24/7 Emergency Service</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Pro Plumbing Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
