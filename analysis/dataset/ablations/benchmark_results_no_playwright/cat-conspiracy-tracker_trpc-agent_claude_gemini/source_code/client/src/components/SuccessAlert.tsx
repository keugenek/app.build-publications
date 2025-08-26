import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface SuccessAlertProps {
  message: string;
  show: boolean;
  onHide: () => void;
  duration?: number;
}

export function SuccessAlert({ message, show, onHide, duration = 3000 }: SuccessAlertProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onHide, 300); // Allow fade out animation
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, onHide, duration]);

  if (!show && !isVisible) return null;

  return (
    <div className={`transition-all duration-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
      <Alert className="border-green-200 bg-green-50">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 font-medium">
            {message}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
