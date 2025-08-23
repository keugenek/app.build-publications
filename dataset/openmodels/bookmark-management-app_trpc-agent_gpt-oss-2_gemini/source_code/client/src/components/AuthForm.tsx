import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User, CreateUserInput, LoginUserInput } from '../../../server/src/schema';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState<LoginUserInput>({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const user = await trpc.loginUser.mutate(form as LoginUserInput);
        onAuthSuccess(user);
      } else {
        const user = await trpc.createUser.mutate(form as CreateUserInput);
        onAuthSuccess(user);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    setForm({ email: '', password: '' });
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        {mode === 'login' ? 'Log In' : 'Create Account'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (mode === 'login' ? 'Logging in...' : 'Creating...') : mode === 'login' ? 'Log In' : 'Sign Up'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={toggleMode}
          className="text-primary underline hover:no-underline"
        >
          {mode === 'login' ? 'Sign up' : 'Log in'}
        </button>
      </p>
    </div>
  );
}
