import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { trpc } from '@/utils/trpc';
import type { LoginInput, CreateUserInput, User } from '../../../server/src/schema';

interface AuthProps {
  onLogin: (userId: number) => void;
}

export function LoginForm({ onLogin }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState<LoginInput & Partial<CreateUserInput>>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const toggleMode = () => {
    setIsRegistering((prev) => !prev);
    setFormData({ email: '', password: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isRegistering) {
        // Register then login
        const registerResp = await trpc.registerUser.mutate({
          email: formData.email,
          password: formData.password,
        } as CreateUserInput);
        // Assuming register returns created user with id
        onLogin((registerResp as User).id);
      } else {
        const loginResp = await trpc.loginUser.mutate(formData as LoginInput);
        // Assuming login returns user object with id
        onLogin((loginResp as User).id);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isRegistering, onLogin]);

  return (
    <div className="max-w-sm mx-auto p-6 bg-white rounded shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isRegistering ? 'Register' : 'Login'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <Input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (isRegistering ? 'Registering...' : 'Logging in...') : (isRegistering ? 'Register' : 'Login')}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={toggleMode}
          className="text-sm text-blue-600 hover:underline"
        >
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </div>
  );
}
