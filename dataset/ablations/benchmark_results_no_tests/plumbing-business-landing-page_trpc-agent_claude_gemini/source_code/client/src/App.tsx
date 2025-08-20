import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { CreateContactLeadInput, ContactLeadResponse } from '../../server/src/schema';

function App() {
  const [formData, setFormData] = useState<CreateContactLeadInput>({
    customer_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResponse, setSubmitResponse] = useState<ContactLeadResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResponse(null);

    try {
      const response = await trpc.createContactLead.mutate(formData);
      setSubmitResponse(response);
      
      // Reset form on successful submission
      if (response.success) {
        setFormData({
          customer_name: '',
          email: '',
          phone: '',
          message: ''
        });
      }
    } catch (error) {
      console.error('Failed to submit contact form:', error);
      setSubmitResponse({
        success: false,
        message: 'Failed to submit your inquiry. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white text-blue-600 p-2 rounded-lg">
                🔧
              </div>
              <div>
                <h1 className="text-2xl font-bold">ProPlumb Solutions</h1>
                <p className="text-blue-100">Professional Plumbing Services</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-right">
                <p className="font-semibold">📞 (555) 123-PIPE</p>
                <p className="text-blue-100 text-sm">24/7 Emergency Service</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Reliable Plumbing Solutions
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-blue-100">
            From emergency repairs to complete installations, our licensed professionals 
            deliver quality plumbing services you can trust. Available 24/7 for your convenience.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="text-lg py-2 px-4">
              ✓ Licensed & Insured
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              ✓ 24/7 Emergency Service
            </Badge>
            <Badge variant="secondary" className="text-lg py-2 px-4">
              ✓ Free Estimates
            </Badge>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">Our Services</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We provide comprehensive plumbing services for residential and commercial properties
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🚿</div>
                <CardTitle>Emergency Repairs</CardTitle>
                <CardDescription>
                  24/7 emergency plumbing services for burst pipes, leaks, and urgent issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Burst pipe repair</li>
                  <li>• Leak detection & repair</li>
                  <li>• Clogged drain clearing</li>
                  <li>• Water heater emergencies</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🚽</div>
                <CardTitle>Bathroom Plumbing</CardTitle>
                <CardDescription>
                  Complete bathroom plumbing solutions from repairs to full renovations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Toilet repair & replacement</li>
                  <li>• Shower & bathtub installation</li>
                  <li>• Faucet repair & replacement</li>
                  <li>• Bathroom renovations</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🍽️</div>
                <CardTitle>Kitchen Plumbing</CardTitle>
                <CardDescription>
                  Kitchen plumbing services including sinks, disposals, and appliance hookups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Kitchen sink installation</li>
                  <li>• Garbage disposal repair</li>
                  <li>• Dishwasher hookup</li>
                  <li>• Water filtration systems</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🔥</div>
                <CardTitle>Water Heater Services</CardTitle>
                <CardDescription>
                  Water heater installation, repair, and maintenance for all types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Traditional tank water heaters</li>
                  <li>• Tankless water heaters</li>
                  <li>• Water heater repair</li>
                  <li>• Annual maintenance</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🏠</div>
                <CardTitle>Pipe Services</CardTitle>
                <CardDescription>
                  Comprehensive pipe services including installation, repair, and replacement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Pipe installation & replacement</li>
                  <li>• Repiping services</li>
                  <li>• Pipe insulation</li>
                  <li>• Sewer line services</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="text-4xl mb-4">🏢</div>
                <CardTitle>Commercial Services</CardTitle>
                <CardDescription>
                  Professional plumbing services for businesses and commercial properties
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-gray-600">
                  <li>• Office building plumbing</li>
                  <li>• Restaurant plumbing</li>
                  <li>• Retail space services</li>
                  <li>• Preventive maintenance</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Don't just take our word for it - hear from satisfied customers across the area
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "ProPlumb Solutions saved the day! Had a major leak at 2 AM and they were here within 30 minutes. 
                  Professional, efficient, and reasonably priced. Highly recommend!"
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    S
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Johnson</p>
                    <p className="text-gray-500 text-sm">Homeowner, Downtown</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Excellent service from start to finish. They replaced our old water heater with a new tankless unit. 
                  Clean work, fair pricing, and great communication throughout the project."
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    M
                  </div>
                  <div>
                    <p className="font-semibold">Mike Rodriguez</p>
                    <p className="text-gray-500 text-sm">Property Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "We've used ProPlumb for several projects now. They're reliable, honest, and their work is always 
                  top-notch. It's rare to find such trustworthy contractors these days."
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    L
                  </div>
                  <div>
                    <p className="font-semibold">Lisa Chen</p>
                    <p className="text-gray-500 text-sm">Restaurant Owner</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Quick response time and fair pricing. The technician explained everything clearly and completed 
                  the job efficiently. Will definitely use them again!"
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    D
                  </div>
                  <div>
                    <p className="font-semibold">David Thompson</p>
                    <p className="text-gray-500 text-sm">Homeowner, Suburbs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Professional service with attention to detail. They went above and beyond to ensure our bathroom 
                  renovation was perfect. Highly satisfied with the results!"
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    A
                  </div>
                  <div>
                    <p className="font-semibold">Amanda Williams</p>
                    <p className="text-gray-500 text-sm">Homeowner, Eastside</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">⭐</span>
                  ))}
                </div>
                <p className="text-gray-600 mb-4 italic">
                  "Transparent pricing and excellent workmanship. They diagnosed the issue quickly and provided 
                  multiple solution options. Great customer service overall."
                </p>
                <div className="flex items-center">
                  <div className="bg-blue-100 text-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mr-4">
                    R
                  </div>
                  <div>
                    <p className="font-semibold">Robert Martinez</p>
                    <p className="text-gray-500 text-sm">Office Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-4xl font-bold text-white mb-4">Get Your Free Estimate</h3>
              <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                Ready to solve your plumbing problems? Fill out the form below and we'll get back to you quickly 
                with a free estimate.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Contact Info */}
              <div className="text-white">
                <div className="space-y-8">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      📞
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Call Us</h4>
                      <p className="text-blue-100">24/7 Emergency Service</p>
                      <p className="text-xl font-bold">(555) 123-PIPE</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      📧
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Email Us</h4>
                      <p className="text-blue-100">For non-urgent inquiries</p>
                      <p>info@proplumbsolutions.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      📍
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Service Area</h4>
                      <p className="text-blue-100">We serve the greater metro area</p>
                      <p>Within 50 miles of downtown</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-500 p-3 rounded-lg">
                      ⏰
                    </div>
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Business Hours</h4>
                      <p className="text-blue-100">Monday - Friday: 7:00 AM - 7:00 PM</p>
                      <p className="text-blue-100">Saturday: 8:00 AM - 5:00 PM</p>
                      <p className="text-blue-100">Sunday: Emergency Only</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Request Your Free Estimate</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll contact you within 24 hours
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <Input
                          id="customer_name"
                          type="text"
                          placeholder="Your full name"
                          value={formData.customer_name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateContactLeadInput) => ({ ...prev, customer_name: e.target.value }))
                          }
                          required
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number *
                        </label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="(555) 123-4567"
                          value={formData.phone}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setFormData((prev: CreateContactLeadInput) => ({ ...prev, phone: e.target.value }))
                          }
                          required
                          className="w-full"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setFormData((prev: CreateContactLeadInput) => ({ ...prev, email: e.target.value }))
                        }
                        required
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                        Tell us about your plumbing needs *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="Describe your plumbing issue or project in detail. Include any urgency level and preferred contact times."
                        value={formData.message}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setFormData((prev: CreateContactLeadInput) => ({ ...prev, message: e.target.value }))
                        }
                        required
                        className="w-full h-32"
                      />
                    </div>

                    {submitResponse && (
                      <div className={`p-4 rounded-md ${
                        submitResponse.success 
                          ? 'bg-green-50 text-green-800 border border-green-200' 
                          : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        <p className="font-medium">
                          {submitResponse.success ? '✅ ' : '❌ '}
                          {submitResponse.message}
                        </p>
                        {submitResponse.success && submitResponse.leadId && (
                          <p className="text-sm mt-1">Reference ID: {submitResponse.leadId}</p>
                        )}
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Submitting...
                        </>
                      ) : (
                        'Get Your Free Estimate'
                      )}
                    </Button>
                    
                    <p className="text-sm text-gray-500 text-center">
                      * Required fields. We respect your privacy and will never share your information.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-600 text-white p-2 rounded-lg">
                  🔧
                </div>
                <div>
                  <h4 className="text-xl font-bold">ProPlumb Solutions</h4>
                  <p className="text-gray-400">Professional Plumbing Services</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4">
                Your trusted partner for all plumbing needs. Licensed, insured, and available 24/7 
                for emergency services.
              </p>
              <div className="flex space-x-4">
                <span className="text-2xl">📘</span>
                <span className="text-2xl">📷</span>
                <span className="text-2xl">🐦</span>
                <span className="text-2xl">📺</span>
              </div>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">Our Services</h5>
              <ul className="space-y-2 text-gray-400">
                <li>Emergency Plumbing Repairs</li>
                <li>Bathroom & Kitchen Plumbing</li>
                <li>Water Heater Services</li>
                <li>Pipe Installation & Repair</li>
                <li>Commercial Plumbing</li>
                <li>Drain Cleaning</li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-lg font-semibold mb-4">Contact Info</h5>
              <div className="space-y-3 text-gray-400">
                <p className="flex items-center">
                  <span className="mr-3">📞</span>
                  (555) 123-PIPE
                </p>
                <p className="flex items-center">
                  <span className="mr-3">📧</span>
                  info@proplumbsolutions.com
                </p>
                <p className="flex items-center">
                  <span className="mr-3">📍</span>
                  Serving Greater Metro Area
                </p>
                <p className="flex items-center">
                  <span className="mr-3">🕒</span>
                  24/7 Emergency Service
                </p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ProPlumb Solutions. All rights reserved. Licensed & Insured.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
