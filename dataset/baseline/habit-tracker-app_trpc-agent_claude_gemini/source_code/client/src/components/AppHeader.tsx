export function AppHeader() {
  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning! ☀️";
    if (hour < 17) return "Good afternoon! 🌤️";
    return "Good evening! 🌙";
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="text-center mb-8">
      <div className="mb-4">
        <h1 className="text-5xl font-bold text-gray-900 mb-2 tracking-tight">
          🎯 Habit Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Build better habits, one day at a time
        </p>
        <div className="text-lg text-indigo-600 font-medium">
          {getCurrentGreeting()}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {getCurrentDate()}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="flex justify-center items-center gap-2 text-2xl opacity-60">
        <span>🌱</span>
        <span>💪</span>
        <span>📈</span>
        <span>🏆</span>
      </div>
    </div>
  );
}
