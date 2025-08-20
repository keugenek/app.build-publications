import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { CreateUserInput, User } from '../../../server/src/schema';

export function UserForm({ onUserCreated }: { onUserCreated?: (user: User) => void }) {
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    skill_level: 'BEGINNER',
    location: '',
    profile_picture_url: null,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await trpc.createUser.mutate(formData);
      onUserCreated?.(user);
      // Reset form
      setFormData({
        username: '',
        skill_level: 'BEGINNER',
        location: '',
        profile_picture_url: null,
      });
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-md bg-background/30">
      <h2 className="text-xl font-semibold">Create Profile</h2>
      <Input
        placeholder="Username"
        value={formData.username}
        onChange={(e) =>
          setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
        }
        required
      />
      <Input
        placeholder="Location"
        value={formData.location}
        onChange={(e) =>
          setFormData((prev: CreateUserInput) => ({ ...prev, location: e.target.value }))
        }
        required
      />
      <Input
        placeholder="Profile picture URL (optional)"
        value={formData.profile_picture_url ?? ''}
        onChange={(e) =>
          setFormData((prev: CreateUserInput) => ({
            ...prev,
            profile_picture_url: e.target.value || null,
          }))
        }
      />
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? 'Creating...' : 'Create Profile'}
      </Button>
    </form>
  );
}
