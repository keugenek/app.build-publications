import './App.css';
import { useState } from 'react';
import { HabitForm } from './components/HabitForm';
import { HabitList } from './components/HabitList';

function App() {
  const [habitListKey, setHabitListKey] = useState(0);

  // Called after a habit is created to refresh the list
  const handleHabitCreated = () => {
    setHabitListKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold text-center mb-6">Habit Tracker</h1>
      <div className="max-w-2xl mx-auto space-y-8">
        <HabitForm onHabitCreated={handleHabitCreated} />
        <HabitList key={habitListKey} />
      </div>
    </div>
  );
}

export default App;
