import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Phone, Mail, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { CreateContactInquiryInput } from '../../../server/src/schema';

export function ContactForm() {
  const [formData, setFormData] = useState<CreateContactInquiryInput>({
    first_name: '',
    last_name: '',
    email: '',
    phone: null,
    service_needed: null,
    message: '',
    is_urgent: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage('');

    try {
      await trpc.createContactInquiry.mutate(formData);
      setSubmitStatus('success');
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone: null,
        service_needed: null,
        message: '',
        is_urgent: false
      });
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit inquiry. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const serviceOptions = [
    'Emergency Plumbing',
    'Drain Cleaning',
    'Water Heater Repair',
    'Bathroom Plumbing',
    'Toilet Repair & Installation',
    'Pipe Installation',
    'Leak Repair',
    'Faucet & Fixture Installation',
    'Sewer Line Services',
    'Other'
  ];

  return (
    <section id="contact" className="py-16 bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Your Free Quote Today
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to solve your plumbing problems? Fill out our contact form and we'll get back to you 
            within the hour, or call us directly for immediate assistance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">Request a Quote</CardTitle>
            </CardHeader>
            <CardContent>
              {submitStatus === 'success' && (
                <Alert className="mb-6 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Thank you! Your inquiry has been submitted successfully. We'll contact you within the hour.
                  </AlertDescription>
                </Alert>
              )}

              {submitStatus === 'error' && (
                <Alert className="mb-6 border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateContactInquiryInput) => ({ 
                          ...prev, 
                          first_name: e.target.value 
                        }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateContactInquiryInput) => ({ 
                          ...prev, 
                          last_name: e.target.value 
                        }))
                      }
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContactInquiryInput) => ({ 
                        ...prev, 
                        email: e.target.value 
                      }))
                    }
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateContactInquiryInput) => ({ 
                        ...prev, 
                        phone: e.target.value || null 
                      }))
                    }
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="service_needed">Service Needed</Label>
                  <Select
                    value={formData.service_needed || ''}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateContactInquiryInput) => ({ 
                        ...prev, 
                        service_needed: value || null 
                      }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceOptions.map((service: string) => (
                        <SelectItem key={service} value={service}>
                          {service}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateContactInquiryInput) => ({ 
                        ...prev, 
                        message: e.target.value 
                      }))
                    }
                    placeholder="Please describe your plumbing issue in detail..."
                    required
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_urgent"
                    checked={formData.is_urgent}
                    onCheckedChange={(checked: boolean) =>
                      setFormData((prev: CreateContactInquiryInput) => ({ 
                        ...prev, 
                        is_urgent: checked 
                      }))
                    }
                  />
                  <Label htmlFor="is_urgent" className="text-sm font-medium">
                    This is an emergency (we'll prioritize your request)
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
                >
                  {isSubmitting ? 'Submitting...' : 'Get My Free Quote'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Phone</p>
                      <a href="tel:+1-555-PLUMBER" className="text-blue-600 hover:text-blue-800">
                        (555) PLUMBER
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Email</p>
                      <a href="mailto:info@yourplumbing.com" className="text-blue-600 hover:text-blue-800">
                        info@yourplumbing.com
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Service Area</p>
                      <p className="text-gray-600">Greater Metropolitan Area</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Business Hours</p>
                      <p className="text-gray-600">24/7 Emergency Service</p>
                      <p className="text-gray-600">Mon-Fri: 7AM-7PM</p>
                      <p className="text-gray-600">Sat-Sun: 8AM-6PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg bg-red-50 border-red-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-red-900 mb-4">🚨 Emergency Service</h3>
                <p className="text-red-800 mb-4">
                  Don't wait if you have a plumbing emergency! Call us immediately for:
                </p>
                <ul className="text-red-800 space-y-1 mb-4">
                  <li>• Burst pipes or major leaks</li>
                  <li>• Sewage backups</li>
                  <li>• No hot water</li>
                  <li>• Flooding or water damage</li>
                </ul>
                <Button className="bg-red-600 hover:bg-red-700 text-white w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Emergency Line: (555) PLUMBER
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
