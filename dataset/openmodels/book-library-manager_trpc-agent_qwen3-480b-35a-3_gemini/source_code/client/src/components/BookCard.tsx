import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book } from '../../../server/src/schema';

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (id: number) => void;
}

const statusColors = {
  'to-read': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
  'reading': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
  'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
};

const statusLabels = {
  'to-read': 'To Read',
  'reading': 'Reading',
  'completed': 'Completed',
};

export function BookCard({ book, onEdit, onDelete }: BookCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{book.title}</CardTitle>
            <CardDescription className="mt-1">by {book.author}</CardDescription>
          </div>
          <Badge className={`${statusColors[book.status]} capitalize`}>
            {statusLabels[book.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Genre:</span> {book.genre}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" onClick={() => onEdit(book)}>
          Edit
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(book.id)}>
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
}
