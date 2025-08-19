import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Note, Category } from '../../../server/src/schema';

interface NoteCardProps {
  note: Note;
  category?: Category;
  onClick: () => void;
}

export function NoteCard({ note, category, onClick }: NoteCardProps) {
  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className="w-full border border-blue-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      style={{ background: 'linear-gradient(135deg, rgb(239 246 255) 0%, rgb(219 234 254) 100%)' }}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium text-blue-800 leading-tight">
            {note.title}
          </CardTitle>
          {category && (
            <Badge 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ml-2 flex-shrink-0"
              style={{ 
                backgroundColor: category.color || '#dbeafe',
                color: '#1e40af',
                border: '1px solid #93c5fd'
              }}
            >
              {category.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-blue-700 text-xs leading-relaxed mb-2">
          {truncateContent(note.content)}
        </p>
        <p className="text-blue-500 text-xs">
          {note.updated_at.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: note.updated_at.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
          })}
        </p>
      </CardContent>
    </Card>
  );
}
