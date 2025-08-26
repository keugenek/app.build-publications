import './App.css';
import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { AuthComponent } from '@/components/AuthComponent';
import { NotesApp } from '@/components/NotesApp';
import type { User } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await trpc.loginUser.mutate({ email, password });
      setUser(userData);
      // Store user in localStorage for persistence
      localStorage.setItem('notes_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRegister = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const userData = await trpc.createUser.mutate({ email, password });
      setUser(userData);
      // Store user in localStorage for persistence
      localStorage.setItem('notes_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('notes_user');
  }, []);

  // Check for stored user on app load
  useEffect(() => {
    const storedUser = localStorage.getItem('notes_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser) as User;
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('notes_user');
      }
    }
  }, []);

  return (
    <div className="min-h-screen pastel-bg">
      {!user ? (
        <AuthComponent
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={isLoading}
        />
      ) : (
        <NotesApp user={user} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
