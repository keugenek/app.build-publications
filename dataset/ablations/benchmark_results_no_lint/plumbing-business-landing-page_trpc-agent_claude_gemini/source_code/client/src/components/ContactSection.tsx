import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateContactSubmissionInput } from '../../../server/src/schema';

export function ContactSection() {
  const [formData, setFormData] = useState<CreateContactSubmissionInput>({
    name: '',
    email: '',
    phone_number: null,
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await trpc.createContactSubmission.mutate(formData);
      setIsSubmitted(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone_number: null,
        message: ''
      });
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-16 bg-blue-600">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold mb-4">Thank You!</h2>
            <p className="text-xl mb-6">
              Your message has been received. We'll get back to you within 24 hours with a free quote!
            </p>
            <Button
              onClick={() => setIsSubmitted(false)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              Send Another Message
            </Button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-blue-600">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            📞 Get Your Free Quote Today
          </h2>
          <p className="text-lg max-w-3xl mx-auto">
            Ready to solve your plumbing problems? Contact us for a free estimate. 
            We respond quickly and provide transparent pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-blue-800">Send Us a Message 💌</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24 hours with a free quote.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContactSubmissionInput) => ({ 
                        ...prev, 
                        name: e.target.value 
                      }))
                    }
                    placeholder="Your full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContactSubmissionInput) => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))
                    }
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContactSubmissionInput) => ({ 
                        ...prev, 
                        phone_number: e.target.value || null 
                      }))
                    }
                    placeholder="(555) 123-4567 (optional)"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateContactSubmissionInput) => ({ 
                        ...prev, 
                        message: e.target.value 
                      }))
                    }
                    placeholder="Describe your plumbing issue or project..."
                    rows={4}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Get Free Quote 🚀'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-blue-800">Contact Information 📋</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-semibold">Phone</p>
                    <p className="text-gray-600">(555) 123-PIPE</p>
                    <p className="text-sm text-orange-600">24/7 Emergency Service</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📧</span>
                  <div>
                    <p className="font-semibold">Email</p>
                    <p className="text-gray-600">info@proplumbing.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-semibold">Service Area</p>
                    <p className="text-gray-600">Greater Metro Area</p>
                    <p className="text-sm text-blue-600">Licensed in all surrounding counties</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl text-blue-800">Why Choose Us? 🌟</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>Licensed & fully insured</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>24/7 emergency service available</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>Transparent, upfront pricing</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>100% satisfaction guarantee</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✅</span>
                    <span>Same-day service when possible</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
