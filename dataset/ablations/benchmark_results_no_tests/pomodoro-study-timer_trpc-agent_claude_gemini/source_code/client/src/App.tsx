import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { PomodoroSession, PomodoroLog } from '../../server/src/schema';

// Audio notification component
const useAudioAlert = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlert = useCallback((frequency: number = 800, duration: number = 200) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.warn('Audio alert failed:', error);
    }
  }, []);

  return playAlert;
};

// Timer display component
interface TimerDisplayProps {
  timeLeft: number;
  phase: string;
  isActive: boolean;
}

function TimerDisplay({ timeLeft, phase, isActive }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  const phaseColors = {
    work: 'bg-red-100 border-red-200 text-red-900',
    short_break: 'bg-green-100 border-green-200 text-green-900',
    long_break: 'bg-blue-100 border-blue-200 text-blue-900',
    idle: 'bg-gray-100 border-gray-200 text-gray-900'
  };

  return (
    <Card className={`p-8 text-center ${phaseColors[phase as keyof typeof phaseColors]}`}>
      <div className="text-6xl font-mono font-bold mb-4">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div className="text-lg capitalize mb-2">
        {phase.replace('_', ' ')}
      </div>
      <div className="text-sm opacity-75">
        {isActive ? '⏸️ Running' : '⏹️ Stopped'}
      </div>
    </Card>
  );
}

// Settings component
interface SettingsProps {
  session: PomodoroSession | null;
  onUpdateSettings: (settings: {
    work_duration: number;
    short_break_duration: number;
    long_break_duration: number;
    long_break_interval: number;
  }) => void;
}

function Settings({ session, onUpdateSettings }: SettingsProps) {
  const [settings, setSettings] = useState({
    work_duration: session?.work_duration || 25,
    short_break_duration: session?.short_break_duration || 5,
    long_break_duration: session?.long_break_duration || 15,
    long_break_interval: session?.long_break_interval || 4
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settings);
  };

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">⚙️ Settings</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Work (min)</label>
          <Input
            type="number"
            min="1"
            max="60"
            value={settings.work_duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings(prev => ({ ...prev, work_duration: parseInt(e.target.value) || 25 }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Short Break (min)</label>
          <Input
            type="number"
            min="1"
            max="30"
            value={settings.short_break_duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings(prev => ({ ...prev, short_break_duration: parseInt(e.target.value) || 5 }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Long Break (min)</label>
          <Input
            type="number"
            min="5"
            max="60"
            value={settings.long_break_duration}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings(prev => ({ ...prev, long_break_duration: parseInt(e.target.value) || 15 }))
            }
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Long Break After</label>
          <Input
            type="number"
            min="2"
            max="10"
            value={settings.long_break_interval}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSettings(prev => ({ ...prev, long_break_interval: parseInt(e.target.value) || 4 }))
            }
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Button type="submit" className="w-full">
            Update Settings
          </Button>
        </div>
      </form>
    </Card>
  );
}

function App() {
  const [session, setSession] = useState<PomodoroSession | null>(null);
  const [dailyLogs, setDailyLogs] = useState<PomodoroLog[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const playAlert = useAudioAlert();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load active session and daily logs
  const loadData = useCallback(async () => {
    try {
      const activeSession = await trpc.getActiveSession.query();
      setSession(activeSession);
      
      const today = new Date().toISOString().split('T')[0];
      const logs = await trpc.getDailyLogs.query({ date: today });
      setDailyLogs(logs);
      
      // Set initial time if session exists
      if (activeSession && activeSession.current_phase !== 'idle') {
        const duration = activeSession.current_phase === 'work' 
          ? activeSession.work_duration 
          : activeSession.current_phase === 'short_break'
          ? activeSession.short_break_duration
          : activeSession.long_break_duration;
        
        if (activeSession.phase_start_time && activeSession.is_active) {
          const elapsed = Math.floor((Date.now() - new Date(activeSession.phase_start_time).getTime()) / 1000 / 60);
          setTimeLeft(Math.max(0, (duration * 60) - (elapsed * 60)));
          setIsRunning(true);
        } else {
          setTimeLeft(duration * 60);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            playAlert(1000, 300); // End of phase alert
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft, playAlert]);

  const createNewSession = async () => {
    try {
      const newSession = await trpc.createPomodoroSession.mutate({
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        long_break_interval: 4
      });
      setSession(newSession);
      setTimeLeft(newSession.work_duration * 60);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const startPhase = async (phaseType: 'work' | 'short_break' | 'long_break') => {
    if (!session) return;
    
    try {
      await trpc.startPhase.mutate({
        session_id: session.id,
        phase_type: phaseType
      });
      
      const duration = phaseType === 'work' 
        ? session.work_duration 
        : phaseType === 'short_break'
        ? session.short_break_duration
        : session.long_break_duration;
      
      setTimeLeft(duration * 60);
      setIsRunning(true);
      setSession(prev => prev ? { 
        ...prev, 
        current_phase: phaseType, 
        is_active: true,
        phase_start_time: new Date()
      } : null);
      
      playAlert(600, 200); // Start of phase alert
    } catch (error) {
      console.error('Failed to start phase:', error);
    }
  };

  const stopTimer = () => {
    setIsRunning(false);
    if (session) {
      setSession(prev => prev ? { ...prev, is_active: false } : null);
    }
  };

  const resumeTimer = () => {
    if (timeLeft > 0) {
      setIsRunning(true);
      if (session) {
        setSession(prev => prev ? { ...prev, is_active: true } : null);
      }
    }
  };

  const completePhase = async () => {
    if (!session) return;
    
    try {
      await trpc.completePhase.mutate({
        session_id: session.id,
        was_interrupted: timeLeft > 0
      });
      
      setIsRunning(false);
      setTimeLeft(0);
      
      // Update completed pomodoros if work phase was completed
      if (session.current_phase === 'work' && timeLeft === 0) {
        setSession(prev => prev ? {
          ...prev,
          completed_pomodoros: prev.completed_pomodoros + 1,
          current_phase: 'idle',
          is_active: false
        } : null);
      } else {
        setSession(prev => prev ? {
          ...prev,
          current_phase: 'idle',
          is_active: false
        } : null);
      }
      
      // Reload daily logs
      loadData();
    } catch (error) {
      console.error('Failed to complete phase:', error);
    }
  };

  const updateSettings = async (settings: {
    work_duration: number;
    short_break_duration: number;
    long_break_duration: number;
    long_break_interval: number;
  }) => {
    if (!session) return;
    
    try {
      await trpc.updatePomodoroSession.mutate({
        id: session.id,
        ...settings
      });
      
      setSession(prev => prev ? { ...prev, ...settings } : null);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const getNextPhaseType = (): 'work' | 'short_break' | 'long_break' => {
    if (!session) return 'work';
    
    if (session.current_phase === 'work') {
      // After work, decide on break type
      return (session.completed_pomodoros + 1) % session.long_break_interval === 0 
        ? 'long_break' 
        : 'short_break';
    } else {
      // After any break, go to work
      return 'work';
    }
  };

  const completedToday = dailyLogs.filter(log => 
    log.phase_type === 'work' && log.completed_at
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍅 Pomodoro</h1>
          <p className="text-gray-600">Brutal focus. Minimal distractions.</p>
        </div>

        {/* Session Status */}
        {session && (
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <Badge variant="outline">
              Session #{session.id}
            </Badge>
            <Badge variant="outline">
              🍅 {session.completed_pomodoros} completed
            </Badge>
            <Badge variant="outline">
              📅 {completedToday} today
            </Badge>
          </div>
        )}

        {/* Timer */}
        {session ? (
          <TimerDisplay 
            timeLeft={timeLeft}
            phase={session.current_phase}
            isActive={isRunning}
          />
        ) : (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">⏰</div>
            <h2 className="text-xl font-semibold mb-4">Ready to focus?</h2>
            <Button onClick={createNewSession} size="lg">
              Start New Session
            </Button>
          </Card>
        )}

        {/* Controls */}
        {session && (
          <div className="flex justify-center space-x-2">
            {session.current_phase === 'idle' ? (
              <>
                <Button 
                  onClick={() => startPhase('work')}
                  size="lg"
                  className="bg-red-600 hover:bg-red-700"
                >
                  🍅 Start Work
                </Button>
                <Button 
                  onClick={() => startPhase(getNextPhaseType() === 'work' ? 'short_break' : getNextPhaseType())}
                  size="lg"
                  variant="outline"
                >
                  {getNextPhaseType() === 'long_break' ? '🏖️ Long Break' : '☕ Short Break'}
                </Button>
              </>
            ) : (
              <>
                {isRunning ? (
                  <Button onClick={stopTimer} size="lg" variant="outline">
                    ⏸️ Pause
                  </Button>
                ) : (
                  <Button onClick={resumeTimer} size="lg">
                    ▶️ Resume
                  </Button>
                )}
                <Button 
                  onClick={completePhase}
                  size="lg"
                  variant="outline"
                >
                  ✓ Complete
                </Button>
              </>
            )}
            <Button 
              onClick={() => setShowSettings(!showSettings)}
              size="lg"
              variant="outline"
            >
              ⚙️
            </Button>
          </div>
        )}

        {/* Settings */}
        {showSettings && session && (
          <Settings 
            session={session}
            onUpdateSettings={updateSettings}
          />
        )}

        {/* Daily Progress */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-3">📊 Today's Progress</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{completedToday}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(completedToday * (session?.work_duration || 25))}m
              </div>
              <div className="text-sm text-gray-600">Work Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {dailyLogs.filter(log => log.was_interrupted).length}
              </div>
              <div className="text-sm text-gray-600">Interrupted</div>
            </div>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          Focus deeply. Work intensely. Rest completely.
        </div>
      </div>
    </div>
  );
}

export default App;
