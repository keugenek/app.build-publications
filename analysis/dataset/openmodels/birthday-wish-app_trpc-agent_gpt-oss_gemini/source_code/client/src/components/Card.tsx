import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className ?? ''}`} {...rest}>
      {children}
    </div>
  );
}
