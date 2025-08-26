interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-gray-500 max-w-md mx-auto mb-4">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
