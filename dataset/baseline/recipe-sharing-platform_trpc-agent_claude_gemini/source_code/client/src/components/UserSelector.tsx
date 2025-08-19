import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { User, Plus, Users } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { User as UserType, CreateUserInput } from '../../../server/src/schema';

interface UserSelectorProps {
  users: UserType[];
  currentUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
}

export function UserSelector({ users, currentUser, onUserChange }: UserSelectorProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateUserInput>({
    username: '',
    email: ''
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username.trim() || !formData.email.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const newUser = await trpc.createUser.mutate(formData);
      onUserChange(newUser);
      setIsCreateDialogOpen(false);
      setFormData({ username: '', email: '' });
      // Note: In a real app, we'd refresh the users list here
      alert('User created successfully! Note: User list will be refreshed on page reload.');
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <Users className="h-4 w-4 text-gray-500" />
        <span className="text-sm text-gray-600">Current User:</span>
      </div>

      {users.length === 0 ? (
        // STUB: No users available (backend placeholder)
        <Card className="p-2">
          <CardContent className="p-2 text-center">
            <p className="text-sm text-gray-500 mb-2">No users available</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="Enter username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? 'Creating...' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center space-x-2">
          <Select
            value={currentUser?.id.toString() || 'none'}
            onValueChange={(value) => {
              if (value === 'none') {
                onUserChange(null);
              } else {
                const user = users.find((u: UserType) => u.id.toString() === value);
                onUserChange(user || null);
              }
            }}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select a user">
                {currentUser && (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {currentUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>{currentUser.username}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>No user selected</span>
                </div>
              </SelectItem>
              {users.map((user: UserType) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.username}</div>
                      <div className="text-xs text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                    }
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create User'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
