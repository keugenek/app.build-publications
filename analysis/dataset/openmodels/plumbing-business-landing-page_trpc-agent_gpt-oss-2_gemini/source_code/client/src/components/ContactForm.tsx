import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateLeadInput } from '../../../server/src/schema';

export function ContactForm() {
  const [formData, setFormData] = useState<CreateLeadInput>({
    name: '',
    email: '',
    phone: '',
    message: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'message' ? (value || null) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createLead.mutate(formData);
      setSubmitted(true);
      setFormData({ name: '', email: '', phone: '', message: null });
    } catch (err) {
      console.error('Failed to submit lead', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white py-12" id="contact">
      <div className="container mx-auto px-4 max-w-2xl">
        <h2 className="text-3xl font-bold text-center mb-6">Get a Free Quote</h2>
        {submitted && (
          <p className="text-center text-green-600 mb-4">
            Thank you! We will get back to you shortly.
          </p>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <Input
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            name="email"
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <Textarea
            name="message"
            placeholder="Message (optional)"
            value={formData.message || ''}
            onChange={handleChange}
            rows={4}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Sending...' : 'Submit'}
          </Button>
        </form>
      </div>
    </section>
  );
}
