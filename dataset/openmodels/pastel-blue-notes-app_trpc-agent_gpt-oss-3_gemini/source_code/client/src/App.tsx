import { useState } from 'react';
import { AuthForm } from '@/components/AuthForm';
import { NotesApp } from '@/components/NotesApp';
import type { User } from '../../server/src/schema';
import './App.css';

function App() {
  const [user, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-blue-100">
      {user ? (
        <NotesApp />
      ) : (
        <AuthForm onAuth={setUser} />
      )}
    </div>
  );
}

export default App;
