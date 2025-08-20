import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput, UserRole } from '../../../server/src/schema';

interface UserAuthProps {
  users: User[];
  onUserSelect: (user: User | null) => void;
  onRefresh: () => void;
}

export function UserAuth({ users, onUserSelect, onRefresh }: UserAuthProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [newUser, setNewUser] = useState<CreateUserInput>({
    name: '',
    email: '',
    role: 'member'
  });

  const handleLogin = () => {
    const user = users.find((u: User) => u.email === selectedEmail);
    if (user) {
      onUserSelect(user);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const createdUser = await trpc.createUser.mutate(newUser);
      onUserSelect(createdUser);
      onRefresh();
    } catch (error) {
      console.error('Failed to create user:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🏋️</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">FitCRM</h1>
          <p className="text-gray-600">Welcome to your Gym Management System</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white border-2 border-orange-200">
            <TabsTrigger value="login" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Login
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
              Register
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">🚪 Login</CardTitle>
                <CardDescription className="text-center">
                  Select your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">
                    No users found. Please register first.
                  </p>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Select User</Label>
                      <Select value={selectedEmail} onValueChange={setSelectedEmail}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your account" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: User) => (
                            <SelectItem key={user.id} value={user.email}>
                              <div className="flex items-center space-x-2">
                                <span>{user.name}</span>
                                <Badge variant={user.role === 'admin' ? 'default' : user.role === 'instructor' ? 'secondary' : 'outline'}>
                                  {user.role}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleLogin} 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={!selectedEmail}
                    >
                      Login 💪
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card className="border-2 border-orange-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-center">📝 Register</CardTitle>
                <CardDescription className="text-center">
                  Create a new account to get started
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter your full name"
                      value={newUser.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUser((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={newUser.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setNewUser((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select 
                      value={newUser.role} 
                      onValueChange={(value: UserRole) => 
                        setNewUser((prev: CreateUserInput) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">👤 Member</SelectItem>
                        <SelectItem value="instructor">🏃‍♂️ Instructor</SelectItem>
                        <SelectItem value="admin">👨‍💼 Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    disabled={isCreating}
                  >
                    {isCreating ? 'Creating Account...' : 'Register & Login 🚀'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
