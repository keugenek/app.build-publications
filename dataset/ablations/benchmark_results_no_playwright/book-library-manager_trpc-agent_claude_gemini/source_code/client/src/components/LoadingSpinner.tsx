interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ message = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className={`animate-spin ${sizeClasses[size]} mb-2`}>
        📚
      </div>
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  );
}
