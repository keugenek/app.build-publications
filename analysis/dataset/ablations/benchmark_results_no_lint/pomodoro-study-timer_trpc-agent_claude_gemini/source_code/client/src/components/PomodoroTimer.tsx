import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, RotateCcw, Settings, BarChart3 } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { TimerSettings } from '@/components/TimerSettings';
import { SessionLog } from '@/components/SessionLog';
import type { TimerSettings as TimerSettingsType, CreateTimerSessionInput } from '../../../server/src/schema';

type TimerMode = 'work' | 'break';
type TimerStatus = 'idle' | 'running' | 'paused';

export function PomodoroTimer() {
  // Timer state
  const [mode, setMode] = useState<TimerMode>('work');
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [settings, setSettings] = useState<TimerSettingsType | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState('timer');
  
  // Refs
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    try {
      const result = await trpc.getTimerSettings.query();
      setSettings(result);
      if (status === 'idle') {
        const duration = mode === 'work' ? result.work_duration_minutes : result.break_duration_minutes;
        setTimeLeft(duration * 60);
        setTotalTime(duration * 60);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, [mode, status]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Audio notification
  const playNotification = useCallback(async (frequency: number = 800, duration: number = 200) => {
    if (!settings?.audio_enabled) return;
    
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext();
      }
      
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.error('Audio notification failed:', error);
    }
  }, [settings?.audio_enabled]);

  // Timer logic
  useEffect(() => {
    if (status === 'running' && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, timeLeft]);

  // Handle timer completion
  useEffect(() => {
    if (status === 'running' && timeLeft === 0) {
      handleTimerComplete();
    }
  }, [status, timeLeft]);

  const handleTimerComplete = async () => {
    setStatus('idle');
    
    // Play completion sound
    await playNotification(mode === 'work' ? 600 : 800, 500);
    
    // Log the completed session
    if (settings) {
      try {
        const sessionData: CreateTimerSessionInput = {
          session_type: mode,
          duration_minutes: mode === 'work' ? settings.work_duration_minutes : settings.break_duration_minutes
        };
        await trpc.createTimerSession.mutate(sessionData);
      } catch (error) {
        console.error('Failed to log session:', error);
      }
    }
    
    // Auto-switch to the next mode
    const nextMode: TimerMode = mode === 'work' ? 'break' : 'work';
    setMode(nextMode);
    
    // Set up next session
    if (settings) {
      const nextDuration = nextMode === 'work' ? settings.work_duration_minutes : settings.break_duration_minutes;
      setTimeLeft(nextDuration * 60);
      setTotalTime(nextDuration * 60);
    }
  };

  const handleStart = () => {
    if (timeLeft === 0 && settings) {
      const duration = mode === 'work' ? settings.work_duration_minutes : settings.break_duration_minutes;
      setTimeLeft(duration * 60);
      setTotalTime(duration * 60);
    }
    setStatus('running');
    playNotification(400, 100);
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleReset = () => {
    setStatus('idle');
    if (settings) {
      const duration = mode === 'work' ? settings.work_duration_minutes : settings.break_duration_minutes;
      setTimeLeft(duration * 60);
      setTotalTime(duration * 60);
    }
  };

  const handleModeSwitch = (newMode: TimerMode) => {
    if (status === 'running') return; // Don't allow switching during active session
    
    setMode(newMode);
    setStatus('idle');
    if (settings) {
      const duration = newMode === 'work' ? settings.work_duration_minutes : settings.break_duration_minutes;
      setTimeLeft(duration * 60);
      setTotalTime(duration * 60);
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading timer settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="mt-6">
          <Card className="bg-white/80 backdrop-blur-sm shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center gap-2 mb-4">
                <Button
                  variant={mode === 'work' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeSwitch('work')}
                  disabled={status === 'running'}
                  className="min-w-20"
                >
                  🍅 Work
                </Button>
                <Button
                  variant={mode === 'break' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleModeSwitch('break')}
                  disabled={status === 'running'}
                  className="min-w-20"
                >
                  ☕ Break
                </Button>
              </div>
              <CardTitle className="text-6xl font-mono font-bold text-gray-800">
                {formatTime(timeLeft)}
              </CardTitle>
              <div className="flex justify-center items-center gap-2 mt-2">
                <Badge variant={mode === 'work' ? 'default' : 'secondary'} className="capitalize">
                  {mode === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Progress value={progressPercentage} className="h-3" />
              
              <div className="flex justify-center gap-3">
                {status === 'running' ? (
                  <Button onClick={handlePause} size="lg" variant="secondary">
                    <Pause className="w-5 h-5 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={handleStart} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    {status === 'paused' ? 'Resume' : 'Start'}
                  </Button>
                )}
                
                <Button onClick={handleReset} size="lg" variant="outline">
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="text-center text-sm text-gray-600">
                {mode === 'work' 
                  ? '🎯 Stay focused and avoid distractions'
                  : '🌱 Take a moment to relax and recharge'
                }
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <TimerSettings 
            settings={settings} 
            onSettingsUpdate={loadSettings}
          />
        </TabsContent>

        <TabsContent value="stats" className="mt-6">
          <SessionLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
