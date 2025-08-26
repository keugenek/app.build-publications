import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
// type-only import for User input schema
import type { CreateUserInput } from '../../../server/src/schema';

export function UserForm() {
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    skill_level: '',
    location: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [created, setCreated] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createUser.mutate(formData);
      setCreated(true);
      // reset form
      setFormData({ name: '', skill_level: '', location: '' });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="max-w-md mx-auto mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">Create Your Profile</h2>
      {created && (
        <p className="text-green-600 text-center mb-4">Profile created! 🎾</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Your name"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Skill level (e.g., Beginner, Intermediate)"
          value={formData.skill_level}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, skill_level: e.target.value }))
          }
          required
        />
        <Input
          placeholder="Location (city or neighborhood)"
          value={formData.location}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, location: e.target.value }))
          }
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? 'Saving...' : 'Create Profile'}
        </Button>
      </form>
    </section>
  );
}
