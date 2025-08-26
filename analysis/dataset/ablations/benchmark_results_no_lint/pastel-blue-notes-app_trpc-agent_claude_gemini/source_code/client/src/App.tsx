import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { AuthForm } from '@/components/AuthForm';
import { NotesApp } from '@/components/NotesApp';
import type { User } from '../../server/src/schema';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session (stub implementation)
  useEffect(() => {
    // In a real app, this would check for stored auth tokens
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLogin = useCallback((user: User) => {
    setCurrentUser(user);
    // Store user info (in real app, store auth token instead)
    localStorage.setItem('currentUser', JSON.stringify(user));
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen pastel-bg flex items-center justify-center">
        <div className="text-lg pastel-accent">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pastel-bg">
      {currentUser ? (
        <NotesApp user={currentUser} onLogout={handleLogout} />
      ) : (
        <AuthForm onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;
