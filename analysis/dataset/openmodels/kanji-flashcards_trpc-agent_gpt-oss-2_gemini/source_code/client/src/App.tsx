import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { KanjiStudy } from '@/components/KanjiStudy';

function App() {
  const [userId, setUserId] = useState<number | null>(null);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {userId ? (
        <KanjiStudy userId={userId} />
      ) : (
        <LoginForm onLogin={setUserId} />
      )}
    </div>
  );
}

export default App;
