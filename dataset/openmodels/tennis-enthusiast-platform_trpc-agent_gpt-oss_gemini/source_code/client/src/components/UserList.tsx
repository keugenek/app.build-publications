import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '../../../server/src/schema';

interface UserListProps {
  users: User[];
  isLoading: boolean;
}

export function UserList({ users, isLoading }: UserListProps) {
  const handleMessage = useCallback((userId: number) => {
    // Stub: In a real app, this would open a chat or messaging UI.
    alert(`Message feature not implemented. User ID: ${userId}`);
  }, []);

  if (isLoading) {
    return <p className="text-center text-gray-500">Loading users...</p>;
  }

  if (users.length === 0) {
    return <p className="text-center text-gray-500">No users found.</p>;
  }

  return (
    <div className="grid gap-4">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center p-4 border rounded-md bg-white shadow-sm"
        >
          <Avatar className="h-12 w-12 mr-4">
            {user.profile_picture_url ? (
              <AvatarImage src={user.profile_picture_url} alt={user.username} />
            ) : null}
            <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">{user.username}</h3>
            <p className="text-sm text-gray-600">
              {user.location} • {user.skill_level}
            </p>
          </div>
          <Button onClick={() => handleMessage(user.id)} className="ml-4">
            Message
          </Button>
        </div>
      ))}
    </div>
  );
}
