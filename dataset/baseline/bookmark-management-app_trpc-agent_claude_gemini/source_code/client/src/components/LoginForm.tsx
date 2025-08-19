import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { CreateUserInput, LoginInput } from '../../../server/src/schema';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  isLoading: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [loginData, setLoginData] = useState<LoginInput>({
    username: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: ''
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!loginData.username || !loginData.password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await onLogin(loginData.username, loginData.password);
    if (!success) {
      setError('Invalid username or password');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsRegistering(true);

    if (!registerData.username || !registerData.email || !registerData.password) {
      setError('Please fill in all fields');
      setIsRegistering(false);
      return;
    }

    if (registerData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsRegistering(false);
      return;
    }

    try {
      await trpc.createUser.mutate(registerData);
      setSuccess('Account created successfully! You can now log in.');
      setRegisterData({ username: '', email: '', password: '' });
    } catch (error) {
      setError('Failed to create account. Username or email might already exist.');
      console.error('Registration error:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Welcome</CardTitle>
        <CardDescription>
          Sign in to your account or create a new one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  type="text"
                  value={loginData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Enter your username"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setLoginData((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4 mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="register-username">Username</Label>
                <Input
                  id="register-username"
                  type="text"
                  value={registerData.username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Choose a username"
                  disabled={isRegistering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter your email"
                  disabled={isRegistering}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRegisterData((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Create a password (min 8 characters)"
                  disabled={isRegistering}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isRegistering}>
                {isRegistering ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert className="mt-4 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mt-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
