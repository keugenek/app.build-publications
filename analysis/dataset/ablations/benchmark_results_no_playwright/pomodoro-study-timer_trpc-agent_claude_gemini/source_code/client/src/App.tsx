import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback, useRef } from 'react';
import type { TimerSettings, UpdateTimerSettingsInput, StudySession } from '../../server/src/schema';

type TimerState = 'idle' | 'work' | 'break';

function App() {
  // Timer state
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState<TimerSettings | null>(null);
  const [tempSettings, setTempSettings] = useState<UpdateTimerSettingsInput>({
    work_duration: 25,
    break_duration: 5
  });
  
  // Daily stats
  const [dailyStats, setDailyStats] = useState<StudySession | null>(null);
  
  // Audio context for beep sound
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Load initial data
  const loadSettings = useCallback(async () => {
    try {
      const result = await trpc.getTimerSettings.query();
      setSettings(result);
      setTempSettings({
        work_duration: result.work_duration,
        break_duration: result.break_duration
      });
      if (timerState === 'idle') {
        setTimeLeft(result.work_duration * 60);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [timerState]);

  const loadDailyStats = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const result = await trpc.getDailyStats.query({ date: today });
      setDailyStats(result);
    } catch (error) {
      console.error('Failed to load daily stats:', error);
    }
  }, []);

  useEffect(() => {
    loadSettings();
    loadDailyStats();
  }, [loadSettings, loadDailyStats]);

  const logCompletedSession = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await trpc.logStudySession.mutate({ date: today });
      loadDailyStats(); // Refresh stats
    } catch (error) {
      console.error('Failed to log session:', error);
    }
  }, [loadDailyStats]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timer finished
          playBeep();
          setIsRunning(false);
          
          if (timerState === 'work') {
            // Work session completed - log it and switch to break
            logCompletedSession();
            setTimerState('break');
            return (settings?.break_duration || 5) * 60;
          } else {
            // Break completed - switch to work
            setTimerState('work');
            return (settings?.work_duration || 25) * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, timerState, settings, logCompletedSession]);

  // Audio beep function
  const playBeep = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5);
    } catch {
      console.log('Audio not available');
    }
  };



  const handleStart = () => {
    if (timerState === 'idle') {
      setTimerState('work');
      setTimeLeft((settings?.work_duration || 25) * 60);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerState('idle');
    setTimeLeft((settings?.work_duration || 25) * 60);
  };

  const handleSkip = () => {
    if (timerState === 'work') {
      logCompletedSession();
      setTimerState('break');
      setTimeLeft((settings?.break_duration || 5) * 60);
    } else {
      setTimerState('work');
      setTimeLeft((settings?.work_duration || 25) * 60);
    }
    setIsRunning(false);
  };

  const updateSettings = async () => {
    try {
      await trpc.updateTimerSettings.mutate(tempSettings);
      loadSettings();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStateColor = () => {
    switch (timerState) {
      case 'work': return 'text-red-600';
      case 'break': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getStateText = () => {
    switch (timerState) {
      case 'work': return 'WORK';
      case 'break': return 'BREAK';
      default: return 'READY';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center space-y-8">
        {/* Timer Display */}
        <div className="space-y-4">
          <div className={`text-sm font-medium tracking-widest ${getStateColor()}`}>
            {getStateText()}
          </div>
          <div className="text-6xl font-mono font-light tracking-wider">
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-3">
          {timerState === 'idle' ? (
            <Button onClick={handleStart} size="lg" className="min-w-20">
              START
            </Button>
          ) : (
            <>
              <Button 
                onClick={isRunning ? handlePause : handleStart} 
                size="lg" 
                variant={isRunning ? "secondary" : "default"}
                className="min-w-20"
              >
                {isRunning ? 'PAUSE' : 'START'}
              </Button>
              <Button onClick={handleReset} size="lg" variant="outline" className="min-w-20">
                RESET
              </Button>
              <Button onClick={handleSkip} size="lg" variant="ghost" className="min-w-20">
                SKIP
              </Button>
            </>
          )}
        </div>

        <Separator />

        {/* Daily Stats */}
        <div className="space-y-2">
          <div className="text-sm text-gray-500">TODAY</div>
          <div className="text-2xl font-light">
            {dailyStats?.completed_sessions || 0} sessions
          </div>
        </div>

        {/* Settings */}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-400">
              SETTINGS
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Timer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="work-duration">Work Duration (minutes)</Label>
                <Input
                  id="work-duration"
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings.work_duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTempSettings((prev: UpdateTimerSettingsInput) => ({
                      ...prev,
                      work_duration: parseInt(e.target.value) || undefined
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                <Input
                  id="break-duration"
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.break_duration || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTempSettings((prev: UpdateTimerSettingsInput) => ({
                      ...prev,
                      break_duration: parseInt(e.target.value) || undefined
                    }))
                  }
                />
              </div>
              <Button onClick={updateSettings} className="w-full">
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}

export default App;
