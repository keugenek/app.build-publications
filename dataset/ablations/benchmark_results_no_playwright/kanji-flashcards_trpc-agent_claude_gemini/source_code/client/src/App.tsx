import { useState, useEffect, useCallback } from 'react';
import { trpc } from '@/utils/trpc';
import { AuthForm } from '@/components/AuthForm';
import { Dashboard } from '@/components/Dashboard';
import { FlashcardReview } from '@/components/FlashcardReview';
import { ProgressTracker } from '@/components/ProgressTracker';
import { KanjiExplorer } from '@/components/KanjiExplorer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, BookOpen, BarChart3, Search, Brain } from 'lucide-react';
import type { AuthResponse, KanjiWithProgress, ProgressStats } from '../../server/src/schema';

function App() {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'review' | 'progress' | 'explore'>('dashboard');
  const [dueReviews, setDueReviews] = useState<KanjiWithProgress[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load user data from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('kanjiApp_user');
    const savedToken = localStorage.getItem('kanjiApp_token');
    
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  // Load user data when user logs in
  const loadUserData = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load due reviews
      const reviews = await trpc.getDueReviews.query({ 
        user_id: user.id, 
        limit: 20 
      });
      setDueReviews(reviews);

      // Load progress stats
      const stats = await trpc.getProgressByLevel.query({ 
        user_id: user.id 
      });
      setProgressStats(stats);
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleLogin = (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setToken(authResponse.token || null);
    
    // Save to localStorage
    localStorage.setItem('kanjiApp_user', JSON.stringify(authResponse.user));
    if (authResponse.token) {
      localStorage.setItem('kanjiApp_token', authResponse.token);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('kanjiApp_user');
    localStorage.removeItem('kanjiApp_token');
    setDueReviews([]);
    setProgressStats([]);
    setActiveTab('dashboard');
  };

  const handleReviewComplete = () => {
    // Reload user data after completing reviews
    loadUserData();
    setActiveTab('dashboard');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">漢字学習 📚</h1>
            <p className="text-gray-600">Master Kanji with Spaced Repetition</p>
          </div>
          <AuthForm onLogin={handleLogin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">漢字学習 📚</h1>
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user.username}</span>!
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
          {/* Navigation Tabs */}
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="review" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span>Review ({dueReviews.length})</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
            <TabsTrigger value="explore" className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Explore</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="dashboard">
            <Dashboard 
              user={user}
              dueReviews={dueReviews}
              progressStats={progressStats}
              isLoading={isLoading}
              onStartReview={() => setActiveTab('review')}
              onRefresh={loadUserData}
            />
          </TabsContent>

          <TabsContent value="review">
            {dueReviews.length > 0 ? (
              <FlashcardReview
                dueReviews={dueReviews}
                userId={user.id}
                onComplete={handleReviewComplete}
                onBackToDashboard={() => setActiveTab('dashboard')}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5" />
                    <span>No Reviews Due</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    🎉 Great job! You don't have any kanji due for review right now. 
                    Check back later or explore new kanji to learn.
                  </p>
                  <Button onClick={() => setActiveTab('explore')}>
                    Explore New Kanji
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracker
              progressStats={progressStats}
              userId={user.id}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="explore">
            <KanjiExplorer
              userId={user.id}
              onKanjiLearned={loadUserData}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
