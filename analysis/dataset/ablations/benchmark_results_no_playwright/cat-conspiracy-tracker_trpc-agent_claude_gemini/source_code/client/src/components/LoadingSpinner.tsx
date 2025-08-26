interface LoadingSpinnerProps {
  message?: string;
}

export function LoadingSpinner({ message = "Loading..." }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {/* Spinning cat emoji */}
        <div className="text-6xl animate-spin">
          🐱
        </div>
        {/* Paw prints orbiting around */}
        <div className="absolute inset-0 animate-pulse">
          <div className="text-2xl absolute -top-2 -right-2 animate-bounce">🐾</div>
          <div className="text-2xl absolute -bottom-2 -left-2 animate-bounce" style={{animationDelay: '0.5s'}}>🐾</div>
        </div>
      </div>
      <div className="text-purple-600 font-medium text-lg">
        {message}
      </div>
      <div className="text-sm text-gray-500">
        Investigating suspicious activities...
      </div>
    </div>
  );
}
