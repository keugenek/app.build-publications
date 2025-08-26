import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, CreateSessionInput, TimerSettings } from '../../server/src/schema';

function App() {
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentMode, setCurrentMode] = useState<'work' | 'break'>('work');
  
  // Timer settings
  const [settings, setSettings] = useState<TimerSettings>({
    workDuration: 25,
    breakDuration: 5
  });
  
  // Session data
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Audio refs
  const startAudioRef = useRef<HTMLAudioElement>(null);
  const endAudioRef = useRef<HTMLAudioElement>(null);
  
  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const result = await trpc.getSessions.query();
      setSessions(result);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }, []);
  
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);
  
  // Timer logic
  useEffect(() => {
    let interval: number;
    
    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      // Session completed
      handleSessionComplete();
    }
    
    return () => window.clearInterval(interval);
  }, [isActive, timeLeft]);
  
  const handleSessionComplete = async () => {
    setIsActive(false);
    
    // Play end sound
    if (endAudioRef.current) {
      endAudioRef.current.play().catch(() => {
        // Ignore audio errors
      });
    }
    
    // Save completed session
    try {
      const sessionData: CreateSessionInput = {
        type: currentMode,
        duration: currentMode === 'work' ? settings.workDuration : settings.breakDuration
      };
      
      const newSession = await trpc.createSession.mutate(sessionData);
      setSessions((prev: Session[]) => [newSession, ...prev]);
      
      // Switch to opposite mode
      const nextMode = currentMode === 'work' ? 'break' : 'work';
      const nextDuration = nextMode === 'work' ? settings.workDuration : settings.breakDuration;
      
      setCurrentMode(nextMode);
      setTimeLeft(nextDuration * 60);
      
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };
  
  const startTimer = () => {
    setIsActive(true);
    
    // Play start sound
    if (startAudioRef.current) {
      startAudioRef.current.play().catch(() => {
        // Ignore audio errors
      });
    }
  };
  
  const pauseTimer = () => {
    setIsActive(false);
  };
  
  const resetTimer = () => {
    setIsActive(false);
    const duration = currentMode === 'work' ? settings.workDuration : settings.breakDuration;
    setTimeLeft(duration * 60);
  };
  
  const switchMode = (mode: 'work' | 'break') => {
    setIsActive(false);
    setCurrentMode(mode);
    const duration = mode === 'work' ? settings.workDuration : settings.breakDuration;
    setTimeLeft(duration * 60);
  };
  
  const updateSettings = async (newSettings: TimerSettings) => {
    try {
      await trpc.validateTimerSettings.query(newSettings);
      setSettings(newSettings);
      
      // Update current timer if not active
      if (!isActive) {
        const duration = currentMode === 'work' ? newSettings.workDuration : newSettings.breakDuration;
        setTimeLeft(duration * 60);
      }
    } catch (error) {
      console.error('Invalid settings:', error);
    }
  };
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const workSessions = sessions.filter(s => s.type === 'work').length;
  const breakSessions = sessions.filter(s => s.type === 'break').length;
  
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      {/* Audio elements */}
      <audio ref={startAudioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBzaJ0fLV" type="audio/wav" />
      </audio>
      <audio ref={endAudioRef} preload="auto">
        <source src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUcBzaJ0fLV" type="audio/wav" />
      </audio>
      
      <div className="w-full max-w-md space-y-8">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-8xl font-mono font-bold mb-4">
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex justify-center gap-2 mb-6">
            <Badge 
              variant={currentMode === 'work' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              WORK
            </Badge>
            <Badge 
              variant={currentMode === 'break' ? 'default' : 'secondary'}
              className="text-lg px-4 py-2"
            >
              BREAK
            </Badge>
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={startTimer} 
              disabled={isActive}
              size="lg"
            >
              START
            </Button>
            <Button 
              onClick={pauseTimer} 
              disabled={!isActive}
              variant="outline"
              size="lg"
            >
              PAUSE
            </Button>
            <Button 
              onClick={resetTimer}
              variant="outline"
              size="lg"
            >
              RESET
            </Button>
          </div>
          
          <div className="flex gap-2 justify-center mt-4">
            <Button 
              onClick={() => switchMode('work')} 
              variant={currentMode === 'work' ? 'default' : 'ghost'}
              disabled={isActive}
            >
              Work ({settings.workDuration}m)
            </Button>
            <Button 
              onClick={() => switchMode('break')} 
              variant={currentMode === 'break' ? 'default' : 'ghost'}
              disabled={isActive}
            >
              Break ({settings.breakDuration}m)
            </Button>
          </div>
        </div>
        
        {/* Settings */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-bold mb-4">SETTINGS</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm">WORK:</label>
                <Input
                  type="number"
                  min="1"
                  max="120"
                  value={settings.workDuration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value) || 1;
                    updateSettings({ ...settings, workDuration: value });
                  }}
                  className="w-20"
                  disabled={isActive}
                />
                <span className="text-sm">minutes</span>
              </div>
              <div className="flex items-center gap-4">
                <label className="w-20 text-sm">BREAK:</label>
                <Input
                  type="number"
                  min="1"
                  max="60"
                  value={settings.breakDuration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const value = parseInt(e.target.value) || 1;
                    updateSettings({ ...settings, breakDuration: value });
                  }}
                  className="w-20"
                  disabled={isActive}
                />
                <span className="text-sm">minutes</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Stats */}
        <div className="text-center text-sm text-gray-600">
          <div>TODAY: {workSessions} WORK • {breakSessions} BREAK</div>
        </div>
        
        <Separator />
        
        {/* Session Log */}
        <div>
          <h3 className="font-bold mb-4">SESSION LOG</h3>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center">No sessions completed yet</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {sessions.map((session: Session) => (
                <div key={session.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant={session.type === 'work' ? 'default' : 'secondary'} className="text-xs">
                      {session.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm">{session.duration}m</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {session.completed_at.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
