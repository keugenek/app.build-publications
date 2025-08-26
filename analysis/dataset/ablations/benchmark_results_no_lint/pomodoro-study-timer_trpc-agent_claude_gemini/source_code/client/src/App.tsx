import './App.css';
import { PomodoroTimer } from '@/components/PomodoroTimer';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍅 Pomodoro Timer</h1>
          <p className="text-gray-600">Focus with the Pomodoro Technique</p>
        </div>
        <PomodoroTimer />
      </div>
    </div>
  );
}

export default App;
