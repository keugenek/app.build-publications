import './App.css';

import { CurrencyConverter } from '@/components/CurrencyConverter';

function App() {
  return (
    <div>
      <div className="gradient"></div>
      <div className="grid"></div>
      <div className="container">
        <CurrencyConverter />
      </div>
    </div>
  );
}

export default App;
