import { useState, FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateLeadInput } from '../../../server/src/schema';

export function ContactSection() {
  const [formData, setFormData] = useState<CreateLeadInput>({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof CreateLeadInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await trpc.createLead.mutate(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (err) {
      console.error('Failed to submit lead', err);
      setError('Something went wrong. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gray-100" id="contact">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6">Contact Us</h2>
        <p className="text-center mb-8 text-gray-600">
          Have a plumbing emergency or need a quote? Fill out the form below and we’ll get back to you shortly.
        </p>
        {success && (
          <div className="bg-green-100 text-green-800 p-4 rounded mb-4 text-center">
            Your request has been submitted successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-800 p-4 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange('name')}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange('email')}
            required
          />
          <Input
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange('phone')}
            required
          />
          <Textarea
            placeholder="Message"
            value={formData.message}
            onChange={handleChange('message')}
            required
            className="resize-none h-32"
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Send Message'}
          </Button>
        </form>
      </div>
    </section>
  );
}
