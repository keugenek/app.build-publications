import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, isBefore, addDays } from 'date-fns';
import { AlertTriangleIcon, CalendarIcon } from 'lucide-react';
import type { PantryItem } from '../../../server/src/schema';

interface PantryItemListProps {
  items: PantryItem[];
  onEdit: (item: PantryItem) => void;
  onDelete: (id: number) => void;
}

export function PantryItemList({ items, onEdit, onDelete }: PantryItemListProps) {
  // Check if item is expiring soon (within 3 days)
  const isExpiringSoon = (date: Date) => {
    return isBefore(date, addDays(new Date(), 3));
  };

  // Check if item is expired
  const isExpired = (date: Date) => {
    return isBefore(date, new Date());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const expiringSoon = isExpiringSoon(item.expiry_date);
        const expired = isExpired(item.expiry_date);
        const status = expired ? 'expired' : expiringSoon ? 'expiring-soon' : 'fresh';
        
        return (
          <Card key={item.id} className="border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Quantity: {item.quantity}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
              
              <div className="mt-3 flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  <span>
                    Expires: {format(item.expiry_date, 'MMM dd, yyyy')}
                  </span>
                </div>
                
                {status !== 'fresh' && (
                  <Badge 
                    variant={status === 'expiring-soon' ? 'default' : 'destructive'}
                    className={status === 'expiring-soon' ? 'bg-yellow-500 hover:bg-yellow-600' : ''}
                  >
                    {status === 'expiring-soon' ? 'Expiring Soon' : 'Expired'}
                  </Badge>
                )}
              </div>
              
              {expiringSoon && !expired && (
                <div className="mt-2 flex items-center text-xs text-yellow-600 dark:text-yellow-400">
                  <AlertTriangleIcon className="mr-1 h-3 w-3" />
                  <span>
                    {Math.ceil((item.expiry_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
