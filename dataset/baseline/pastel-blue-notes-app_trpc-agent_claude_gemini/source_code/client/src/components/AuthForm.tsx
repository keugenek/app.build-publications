import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import type { LoginInput, RegisterInput, AuthResponse } from '../../../server/src/schema';

interface AuthFormProps {
  onAuthSuccess: (authResponse: AuthResponse) => void;
}

export function AuthForm({ onAuthSuccess }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [loginData, setLoginData] = useState<LoginInput>({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<RegisterInput>({
    email: '',
    password: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.login.mutate(loginData);
      onAuthSuccess(response);
    } catch (err) {
      setError('Login failed. Please check your credentials.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await trpc.register.mutate(registerData);
      onAuthSuccess(response);
    } catch (err) {
      setError('Registration failed. Email might already be in use.');
      console.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, rgb(248 250 252) 0%, rgba(224, 242, 254, 0.3) 100%)' }}
    >
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-blue-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light text-blue-800">
            📝 Notes
          </CardTitle>
          <p className="text-blue-600 text-sm">Your minimalist note-taking companion</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 bg-blue-50 border border-blue-200">
              <TabsTrigger value="login" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-white data-[state=active]:text-blue-700">
                Sign Up
              </TabsTrigger>
            </TabsList>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={loginData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                    style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={loginData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                    style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium" 
                  style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={registerData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                    style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                    required
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Password (min. 6 characters)"
                    value={registerData.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterData((prev: RegisterInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-200"
                    style={{ background: 'rgba(239, 246, 255, 0.3)' }}
                    minLength={6}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 font-medium" 
                  style={{ background: 'linear-gradient(90deg, rgb(96 165 250) 0%, rgb(59 130 246) 100%)' }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
