import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Edit2, Trash2, Calendar, User, Tag } from 'lucide-react';
import type { Book } from '../../../server/src/schema';

interface BookListProps {
  books: Book[];
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export function BookList({ books, onEdit, onDelete, isLoading = false }: BookListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Finished':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Reading':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'To Read':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'Finished':
        return '✅';
      case 'Reading':
        return '📖';
      case 'To Read':
        return '📚';
      default:
        return '📄';
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book: Book) => (
        <Card 
          key={book.id} 
          className="hover:shadow-lg transition-shadow duration-200 border-indigo-100 bg-white"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <div className="flex items-center text-sm text-gray-600 mb-2">
                  <User className="h-4 w-4 mr-1" />
                  <span>{book.author}</span>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(book.reading_status)} shrink-0 ml-2`}
              >
                {getStatusEmoji(book.reading_status)} {book.reading_status}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-gray-600">
                <Tag className="h-4 w-4 mr-2" />
                <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md text-xs font-medium">
                  {book.genre}
                </span>
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Added {book.created_at.toLocaleDateString()}</span>
                {book.created_at.getTime() !== book.updated_at.getTime() && (
                  <span className="ml-2">• Updated {book.updated_at.toLocaleDateString()}</span>
                )}
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(book)}
                  disabled={isLoading}
                  className="flex-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(book.id)}
                  disabled={isLoading}
                  className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
