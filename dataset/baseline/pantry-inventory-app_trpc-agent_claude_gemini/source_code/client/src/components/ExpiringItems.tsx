import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import type { PantryItem } from '../../../server/src/schema';

interface ExpiringItemsProps {
  items: PantryItem[];
}

export function ExpiringItems({ items }: ExpiringItemsProps) {
  const getDaysUntilExpiry = (expiryDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getUrgencyLevel = (days: number): 'expired' | 'critical' | 'warning' | 'moderate' => {
    if (days < 0) return 'expired';
    if (days <= 1) return 'critical';
    if (days <= 3) return 'warning';
    return 'moderate';
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'expired': return 'border-red-200 bg-red-50';
      case 'critical': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-amber-200 bg-amber-50';
      case 'moderate': return 'border-yellow-200 bg-yellow-50';
      default: return '';
    }
  };

  const getUrgencyBadge = (days: number, level: string) => {
    if (level === 'expired') {
      return <Badge variant="destructive" className="text-xs">❌ Expired {Math.abs(days)} day(s) ago</Badge>;
    }
    if (level === 'critical') {
      return <Badge variant="destructive" className="text-xs">🚨 {days === 0 ? 'Expires today' : 'Expires tomorrow'}</Badge>;
    }
    if (level === 'warning') {
      return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200">⚠️ Expires in {days} days</Badge>;
    }
    return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">⏰ Expires in {days} days</Badge>;
  };

  // Sort items by days until expiry (most urgent first)
  const sortedItems = [...items].sort((a, b) => {
    const daysA = getDaysUntilExpiry(a.expiry_date);
    const daysB = getDaysUntilExpiry(b.expiry_date);
    return daysA - daysB;
  });

  if (items.length === 0) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>🎉 Great news!</strong> You don't have any items expiring in the next 7 days. Your pantry is well managed!
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Priority items:</strong> Use these ingredients soon to avoid waste!
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        {sortedItems.map((item: PantryItem) => {
          const daysUntilExpiry = getDaysUntilExpiry(item.expiry_date);
          const urgencyLevel = getUrgencyLevel(daysUntilExpiry);
          
          return (
            <Card 
              key={item.id}
              className={`transition-all duration-200 ${getUrgencyColor(urgencyLevel)} border-l-4`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        Qty: {item.quantity}
                      </Badge>
                      {getUrgencyBadge(daysUntilExpiry, urgencyLevel)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Expires: {formatDate(item.expiry_date)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl mb-1">
                      {urgencyLevel === 'expired' && '💀'}
                      {urgencyLevel === 'critical' && '🚨'}
                      {urgencyLevel === 'warning' && '⚠️'}
                      {urgencyLevel === 'moderate' && '⏰'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {urgencyLevel === 'expired' ? 'Use immediately or discard' : 'Plan to use soon'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recipe suggestion hint */}
      <Alert className="border-blue-200 bg-blue-50">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 text-lg">💡</div>
          <AlertDescription className="text-blue-800">
            <strong>Tip:</strong> Check the "Recipes" tab to get cooking ideas using these expiring ingredients!
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
