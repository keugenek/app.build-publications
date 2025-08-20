import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import type { Book } from '../../../server/src/schema';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  statusVariant: 'default' | 'secondary' | 'outline';
}

export function BookCard({ book, onEdit, onDelete, statusVariant }: BookCardProps) {
  // Get emoji for reading status
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Read':
        return '✅';
      case 'Currently Reading':
        return '📖';
      case 'Want to Read':
        return '🔖';
      default:
        return '📚';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Card className="book-card-hover border-l-4 border-l-blue-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate mb-1">
              📖 {book.title}
            </h3>
            <p className="text-gray-600 truncate mb-2">
              👤 by {book.author}
            </p>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-gray-50">
                🏷️ {book.genre}
              </Badge>
              <Badge 
                variant={statusVariant} 
                className={`text-xs ${
                  book.reading_status === 'Read' ? 'status-read' :
                  book.reading_status === 'Currently Reading' ? 'status-reading' :
                  'status-want'
                }`}
              >
                {getStatusEmoji(book.reading_status)} {book.reading_status}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-1 ml-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(book)}
              className="h-8 w-8 p-0"
              title="Edit book"
            >
              ✏️
            </Button>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete book"
                >
                  🗑️
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{book.title}" by {book.author}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDelete(book.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-gray-400 border-t pt-2">
          <div className="flex justify-between">
            <span>Added: {formatDate(book.created_at)}</span>
            {book.updated_at.getTime() !== book.created_at.getTime() && (
              <span>Updated: {formatDate(book.updated_at)}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
