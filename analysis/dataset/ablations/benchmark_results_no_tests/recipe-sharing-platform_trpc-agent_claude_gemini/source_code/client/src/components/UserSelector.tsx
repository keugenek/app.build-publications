import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from 'lucide-react';
import type { User as UserType } from '../../../server/src/schema';

interface UserSelectorProps {
  users: UserType[];
  currentUser: UserType | null;
  onUserChange: (user: UserType | null) => void;
}

export function UserSelector({ users, currentUser, onUserChange }: UserSelectorProps) {
  const handleUserChange = (userId: string) => {
    const user = users.find(u => u.id.toString() === userId) || null;
    onUserChange(user);
  };

  return (
    <div className="flex items-center space-x-2">
      <User className="h-4 w-4 text-gray-500" />
      <Select 
        value={currentUser?.id.toString() || ''} 
        onValueChange={handleUserChange}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Select user..." />
        </SelectTrigger>
        <SelectContent>
          {users.map((user: UserType) => (
            <SelectItem key={user.id} value={user.id.toString()}>
              {user.username}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
