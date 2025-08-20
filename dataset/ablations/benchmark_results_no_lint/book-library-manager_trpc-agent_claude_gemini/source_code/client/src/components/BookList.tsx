import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import type { Book } from '../../../server/src/schema';

interface BookListProps {
  books: Book[];
  isLoading: boolean;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'To Read':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    case 'Reading':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
    case 'Finished':
      return 'bg-green-100 text-green-800 hover:bg-green-200';
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  }
};

const getStatusEmoji = (status: string) => {
  switch (status) {
    case 'To Read':
      return '📖';
    case 'Reading':
      return '📚';
    case 'Finished':
      return '✅';
    default:
      return '📖';
  }
};

export function BookList({ books, isLoading, onEdit, onDelete }: BookListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-6 w-20" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-16 mr-2" />
              <Skeleton className="h-8 w-16" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No books found</h3>
        <p className="text-gray-600">
          Start building your library by adding your first book!
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {books.map((book: Book) => (
        <Card key={book.id} className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg line-clamp-2">{book.title}</CardTitle>
            <CardDescription className="text-base font-medium text-gray-700">
              by {book.author}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">Genre:</span>
                <p className="text-sm text-gray-900">{book.genre}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-500">Status:</span>
                <Badge variant="secondary" className={getStatusColor(book.reading_status)}>
                  <span className="mr-1">{getStatusEmoji(book.reading_status)}</span>
                  {book.reading_status}
                </Badge>
              </div>
              <div>
                <span className="text-xs text-gray-400">
                  Added {book.created_at.toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(book)}
            >
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Book</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{book.title}"? This action cannot be undone.
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
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
