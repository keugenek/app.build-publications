import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      toastOptions={{
        classNames: {
          toast: 'border border-gray-200',
          title: 'font-semibold',
          description: 'text-gray-500',
          success: 'bg-green-50 text-green-900 border-green-200',
          error: 'bg-red-50 text-red-900 border-red-200',
          warning: 'bg-yellow-50 text-yellow-900 border-yellow-200',
        },
      }}
    />
  );
}
