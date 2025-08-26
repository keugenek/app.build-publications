import { Folder, FolderOpen, Trash2, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Folder as FolderType } from '../../../server/src/schema';

interface SidebarProps {
  folders: FolderType[];
  selectedFolder: FolderType | null;
  onSelectFolder: (folder: FolderType | null) => void;
  onDeleteFolder: (folderId: number) => void;
}

export function Sidebar({ folders, selectedFolder, onSelectFolder, onDeleteFolder }: SidebarProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-sm font-medium text-blue-700 mb-3">Folders</h2>
        
        {/* All Notes (no folder) */}
        <div
          className={`folder-item flex items-center justify-between mb-2 ${
            selectedFolder === null ? 'active-item' : ''
          }`}
          onClick={() => onSelectFolder(null)}
        >
          <div className="flex items-center">
            <StickyNote className="h-4 w-4 mr-2 text-blue-500" />
            <span className="text-sm text-blue-800">All Notes</span>
          </div>
        </div>

        {/* Folder List */}
        <div className="space-y-1">
          {folders.map((folder: FolderType) => (
            <div
              key={folder.id}
              className={`folder-item flex items-center justify-between group ${
                selectedFolder?.id === folder.id ? 'active-item' : ''
              }`}
            >
              <div
                className="flex items-center flex-1 cursor-pointer"
                onClick={() => onSelectFolder(folder)}
              >
                {selectedFolder?.id === folder.id ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-600" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                )}
                <span className="text-sm text-blue-800 truncate">{folder.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 hover:bg-red-100"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onDeleteFolder(folder.id);
                }}
              >
                <Trash2 className="h-3 w-3 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        {folders.length === 0 && (
          <div className="text-xs text-blue-500 text-center py-8">
            No folders yet. Create one to organize your notes!
          </div>
        )}
      </div>
    </div>
  );
}
