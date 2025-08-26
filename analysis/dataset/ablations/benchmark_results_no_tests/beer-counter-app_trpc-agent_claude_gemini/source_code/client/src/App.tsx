import { BeerCounter } from '@/components/BeerCounter';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-800 mb-2">
            Beer Counter App
          </h1>
          <p className="text-gray-600">
            Keep track of your beers with this simple counter
          </p>
        </div>
        
        <BeerCounter />
        
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Your count is automatically saved and will persist between sessions</p>
        </div>
      </div>
    </div>
  );
}

export default App;
