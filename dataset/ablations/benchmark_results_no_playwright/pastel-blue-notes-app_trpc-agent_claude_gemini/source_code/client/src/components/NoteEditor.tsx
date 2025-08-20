import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Clock } from 'lucide-react';
// Simple date formatting helper
const formatDistanceToNow = (date: Date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};
import type { Note, Folder } from '../../../server/src/schema';

interface NoteEditorProps {
  note: Note;
  folders: Folder[];
  onUpdate: (note: Note) => void;
  onClose: () => void;
}

export function NoteEditor({ note, folders, onUpdate, onClose }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [folderId, setFolderId] = useState<string>(note.folder_id?.toString() || 'null');
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track changes
  useEffect(() => {
    const hasModifications = 
      title !== note.title || 
      content !== note.content || 
      (folderId === 'null' ? null : parseInt(folderId)) !== note.folder_id;
    setHasChanges(hasModifications);
  }, [title, content, folderId, note]);

  // Auto-save functionality
  const saveNote = useCallback(async () => {
    if (!hasChanges) return;
    
    setIsSaving(true);
    const updatedNote: Note = {
      ...note,
      title,
      content,
      folder_id: folderId === 'null' ? null : parseInt(folderId),
      updated_at: new Date()
    };
    
    try {
      await onUpdate(updatedNote);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  }, [title, content, folderId, hasChanges, note, onUpdate]);

  // Auto-save every 2 seconds when there are changes
  useEffect(() => {
    if (!hasChanges) return;
    
    const timeoutId = setTimeout(() => {
      saveNote();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [hasChanges, saveNote]);

  // Save on manual trigger
  const handleSave = () => {
    saveNote();
  };

  // Handle close with unsaved changes
  const handleClose = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Save before closing?')) {
        saveNote().then(() => onClose());
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="border-b border-blue-200/50 p-4 flex items-center justify-between pastel-card">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-2 text-xs text-blue-500">
            <Clock className="h-3 w-3" />
            <span>
              Last updated {formatDistanceToNow(note.updated_at)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Folder selector */}
          <Select value={folderId} onValueChange={setFolderId}>
            <SelectTrigger className="w-48 h-8 text-xs border-blue-200">
              <SelectValue placeholder="Select folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="null">No Folder</SelectItem>
              {folders.map((folder: Folder) => (
                <SelectItem key={folder.id} value={folder.id.toString()}>
                  {folder.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="pastel-button"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Saving...' : hasChanges ? 'Save' : 'Saved'}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 p-6 space-y-4">
        <Input
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
          placeholder="Note title..."
          className="text-xl font-semibold border-none shadow-none p-0 focus-visible:ring-0 text-blue-900 placeholder:text-blue-400"
          style={{ fontSize: '1.5rem', lineHeight: '2rem' }}
        />
        
        <Textarea
          value={content}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
          placeholder="Start writing your note..."
          className="flex-1 min-h-96 resize-none border-none shadow-none p-0 focus-visible:ring-0 text-blue-800 placeholder:text-blue-400 leading-relaxed"
          style={{ fontSize: '1rem', lineHeight: '1.75' }}
        />
      </div>

      {/* Status bar */}
      <div className="border-t border-blue-200/50 p-3 flex items-center justify-between text-xs text-blue-500 bg-blue-50/30">
        <div>
          {content.split(/\s+/).filter(word => word.length > 0).length} words, {content.length} characters
        </div>
        <div className="flex items-center space-x-2">
          {hasChanges && (
            <span className="text-orange-500">• Unsaved changes</span>
          )}
          {isSaving && (
            <span className="text-blue-600">• Saving...</span>
          )}
        </div>
      </div>
    </div>
  );
}
