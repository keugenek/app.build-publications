import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateFolderInput } from '../../../server/src/schema';

interface FolderFormProps {
  userId: number;
  onCreateFolder: (folderData: CreateFolderInput) => Promise<void>;
  onCancel?: () => void;
}

export function FolderForm({ userId, onCreateFolder, onCancel }: FolderFormProps) {
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    const folderData: CreateFolderInput = {
      user_id: userId,
      name,
      color: null
    };
    
    await onCreateFolder(folderData);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        placeholder="Folder name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="border-blue-200 focus:border-blue-400 focus:ring-blue-300 flex-1"
      />
      <Button 
        type="submit"
        disabled={!name.trim()}
        className="bg-blue-500 hover:bg-blue-600 text-white"
      >
        Add
      </Button>
      {onCancel && (
        <Button 
          type="button"
          variant="outline" 
          onClick={onCancel}
          className="border-blue-300 text-blue-700 hover:bg-blue-50"
        >
          Cancel
        </Button>
      )}
    </form>
  );
}
