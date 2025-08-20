import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, RegisterUserInput, LoginUserInput } from '../../../server/src/schema';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

export function AuthForm({ onLogin }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loginForm, setLoginForm] = useState<LoginUserInput>({
    email: '',
    password: ''
  });
  
  const [registerForm, setRegisterForm] = useState<RegisterUserInput>({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await trpc.loginUser.mutate(loginForm);
      onLogin(user);
    } catch (error) {
      setError('Invalid email or password');
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await trpc.registerUser.mutate(registerForm);
      onLogin(user);
    } catch (error) {
      setError('Registration failed. Email might already be taken.');
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light pastel-accent mb-2">📝 Notes</h1>
          <p className="pastel-muted">Your minimalist note-taking companion</p>
        </div>
        
        <Card className="pastel-card">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login" className="pastel-secondary">Login</TabsTrigger>
              <TabsTrigger value="register" className="pastel-secondary">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-light pastel-accent">Welcome back</CardTitle>
                <CardDescription className="pastel-muted">Sign in to access your notes</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                  {error && (
                    <Alert className="border-red-300 bg-red-100">
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full pastel-primary" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-light pastel-accent">Create account</CardTitle>
                <CardDescription className="pastel-muted">Start organizing your thoughts</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((prev: RegisterUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password (min 8 characters)"
                    value={registerForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((prev: RegisterUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="border-gray-300 focus:border-blue-500"
                    minLength={8}
                    required
                  />
                  {error && (
                    <Alert className="border-red-300 bg-red-100">
                      <AlertDescription className="text-red-600">{error}</AlertDescription>
                    </Alert>
                  )}
                  <Button type="submit" className="w-full pastel-primary" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
