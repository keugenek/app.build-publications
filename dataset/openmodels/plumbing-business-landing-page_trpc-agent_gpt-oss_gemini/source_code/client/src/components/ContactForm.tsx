import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { ContactFormInput } from '../../../server/src/schema';

export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormInput>({
    name: '',
    email: '',
    phone: undefined,
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || undefined, // preserve undefined for optional fields
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccess(null);
    setError(null);
    try {
      await trpc.submitContact.mutate(formData);
      setSuccess('Your message has been sent! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: undefined, message: '' });
    } catch (err) {
      setError('Failed to send message. Please try again later.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {success && <p className="text-green-600">{success}</p>}
      {error && <p className="text-red-600">{error}</p>}
      <Input
        name="name"
        placeholder="Your name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      <Input
        name="email"
        type="email"
        placeholder="Your email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      <Input
        name="phone"
        placeholder="Phone (optional)"
        value={formData.phone ?? ''}
        onChange={handleChange}
      />
      <Textarea
        name="message"
        placeholder="Your message"
        value={formData.message}
        onChange={handleChange}
        required
        className="h-32"
      />
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
}
