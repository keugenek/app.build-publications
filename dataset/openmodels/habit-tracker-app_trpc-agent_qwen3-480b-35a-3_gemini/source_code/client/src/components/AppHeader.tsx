export function AppHeader() {
  return (
    <header className="text-center py-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center justify-center gap-2">
        <span>🎯</span>
        <span>Habit Tracker</span>
        <span>📅</span>
      </h1>
      <p className="text-gray-600 dark:text-gray-300 mt-2">
        Build better habits, one day at a time
      </p>
    </header>
  );
}
