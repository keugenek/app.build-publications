import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { PomodoroSettings, CreatePomodoroSessionInput } from '../../server/src/schema';

function App() {
  // Timer state
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [pomodorosCompleted, setPomodorosCompleted] = useState<number>(0);
  
  // Settings
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [workDuration, setWorkDuration] = useState<number>(25 * 60);
  const [shortBreakDuration, setShortBreakDuration] = useState<number>(5 * 60);
  const [longBreakDuration, setLongBreakDuration] = useState<number>(15 * 60);
  const [longBreakInterval, setLongBreakInterval] = useState<number>(4);
  
  // Audio refs
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const handleTimerCompletion = useCallback(async () => {
    setIsRunning(false);
    
    try {
      // Play appropriate sound
      if (currentMode === 'work') {
        // Play work end sound
        playWorkEndSound();
        
        // Record completed pomodoro
        setPomodorosCompleted(prev => prev + 1);
        
        // Create session record
        const sessionData: CreatePomodoroSessionInput = {
          startTime: new Date(Date.now() - workDuration * 1000),
          endTime: new Date(),
          isWorkSession: 1
        };
        await trpc.createPomodoroSession.mutate(sessionData);
      } else {
        // Play break end sound
        playBreakEndSound();
      }
      
      // Determine next mode
      let nextMode: 'work' | 'shortBreak' | 'longBreak' = 'work';
      let nextDuration = workDuration;
      
      if (currentMode === 'work') {
        // After work, determine break type
        if ((pomodorosCompleted + 1) % longBreakInterval === 0) {
          nextMode = 'longBreak';
          nextDuration = longBreakDuration;
        } else {
          nextMode = 'shortBreak';
          nextDuration = shortBreakDuration;
        }
      } else {
        // After any break, go back to work
        nextMode = 'work';
        nextDuration = workDuration;
      }
      
      setCurrentMode(nextMode);
      setTimeLeft(nextDuration);
      
      // Update timer state on server
      await trpc.updateTimerState.mutate({
        isRunning: false,
        currentTime: nextDuration,
        currentMode: nextMode,
        pomodorosCompleted: currentMode === 'work' ? pomodorosCompleted + 1 : pomodorosCompleted
      });
    } catch (error) {
      console.error('Error handling timer completion:', error);
    }
  }, [currentMode, workDuration, longBreakDuration, shortBreakDuration, longBreakInterval, pomodorosCompleted]);
  
  // Fetch initial settings and state
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const settingsData = await trpc.getPomodoroSettings.query();
        setSettings(settingsData);
        setWorkDuration(settingsData.workDuration);
        setShortBreakDuration(settingsData.shortBreakDuration);
        setLongBreakDuration(settingsData.longBreakDuration);
        setLongBreakInterval(settingsData.longBreakInterval);
        setTimeLeft(settingsData.workDuration);
        
        const timerState = await trpc.getTimerState.query();
        setIsRunning(timerState.isRunning);
        setCurrentMode(timerState.currentMode);
        setPomodorosCompleted(timerState.pomodorosCompleted);
        
        // Set initial time based on mode
        if (timerState.currentMode === 'work') {
          setTimeLeft(settingsData.workDuration);
        } else if (timerState.currentMode === 'shortBreak') {
          setTimeLeft(settingsData.shortBreakDuration);
        } else {
          setTimeLeft(settingsData.longBreakDuration);
        }
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);
  
  // Initialize audio context
  useEffect(() => {
    // @ts-expect-error - webkitAudioContext is not in the standard types but is supported in Safari
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  // Timer effect
  useEffect(() => {
    let interval: number | undefined = undefined;
    
    if (isRunning && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      // Timer completed
      handleTimerCompletion();
    }
    
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [isRunning, timeLeft, handleTimerCompletion]);
  
  const playWorkEndSound = () => {
    // Simple beep using Web Audio API
    try {
      if (!audioContextRef.current) return;
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 880; // A5 note
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 500);
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  };
  
  const playBreakEndSound = () => {
    // Different beep for break end
    try {
      if (!audioContextRef.current) return;
      
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
      }, 500);
    } catch (e) {
      console.log('Audio playback failed:', e);
    }
  };
  
  const toggleTimer = () => {
    setIsRunning(!isRunning);
    
    // Update server state
    trpc.updateTimerState.mutate({
      isRunning: !isRunning,
      currentTime: timeLeft,
      currentMode,
      pomodorosCompleted
    }).catch(error => console.error('Failed to update timer state:', error));
  };
  
  const resetTimer = () => {
    setIsRunning(false);
    if (currentMode === 'work') {
      setTimeLeft(workDuration);
    } else if (currentMode === 'shortBreak') {
      setTimeLeft(shortBreakDuration);
    } else {
      setTimeLeft(longBreakDuration);
    }
  };
  
  const switchMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setIsRunning(false);
    setCurrentMode(mode);
    
    if (mode === 'work') {
      setTimeLeft(workDuration);
    } else if (mode === 'shortBreak') {
      setTimeLeft(shortBreakDuration);
    } else {
      setTimeLeft(longBreakDuration);
    }
  };
  
  const saveSettings = async () => {
    try {
      if (settings) {
        const updatedSettings = await trpc.updatePomodoroSettings.mutate({
          id: settings.id,
          workDuration,
          shortBreakDuration,
          longBreakDuration,
          longBreakInterval
        });
        setSettings(updatedSettings);
      } else {
        const newSettings = await trpc.createPomodoroSettings.mutate({
          workDuration,
          shortBreakDuration,
          longBreakDuration,
          longBreakInterval
        });
        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getModeColor = () => {
    switch (currentMode) {
      case 'work': return 'bg-red-500';
      case 'shortBreak': return 'bg-green-500';
      case 'longBreak': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };
  
  const getModeText = () => {
    switch (currentMode) {
      case 'work': return 'Focus Time';
      case 'shortBreak': return 'Short Break';
      case 'longBreak': return 'Long Break';
      default: return 'Pomodoro';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="w-full shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Pomodoro Timer</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Stay focused and productive
            </p>
          </CardHeader>
          <CardContent>
            {/* Timer Display */}
            <div className="flex flex-col items-center justify-center mb-8">
              <Badge 
                className={`mb-4 px-4 py-1 text-lg ${getModeColor()}`}
              >
                {getModeText()}
              </Badge>
              <div className="text-6xl font-mono font-bold mb-6">
                {formatTime(timeLeft)}
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={toggleTimer}
                  className="px-8 py-6 text-lg"
                >
                  {isRunning ? 'Pause' : 'Start'}
                </Button>
                <Button 
                  onClick={resetTimer}
                  variant="outline"
                  className="px-6 py-6 text-lg"
                >
                  Reset
                </Button>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Mode Switcher */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Quick Switch</h3>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  onClick={() => switchMode('work')}
                  variant={currentMode === 'work' ? 'default' : 'outline'}
                >
                  Work
                </Button>
                <Button 
                  onClick={() => switchMode('shortBreak')}
                  variant={currentMode === 'shortBreak' ? 'default' : 'outline'}
                >
                  Short Break
                </Button>
                <Button 
                  onClick={() => switchMode('longBreak')}
                  variant={currentMode === 'longBreak' ? 'default' : 'outline'}
                >
                  Long Break
                </Button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3">Session Stats</h3>
              <div className="flex justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold">{pomodorosCompleted}</div>
                  <div className="text-sm text-gray-500">Pomodoros</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {Math.floor((pomodorosCompleted * workDuration) / 60)}
                  </div>
                  <div className="text-sm text-gray-500">Minutes Focused</div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            {/* Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Settings</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Work Duration</label>
                    <span>{formatTime(workDuration)}</span>
                  </div>
                  <Slider
                    value={[workDuration]}
                    min={1}
                    max={60 * 60}
                    step={1}
                    onValueChange={([value]) => setWorkDuration(value)}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Short Break</label>
                    <span>{formatTime(shortBreakDuration)}</span>
                  </div>
                  <Slider
                    value={[shortBreakDuration]}
                    min={1}
                    max={30 * 60}
                    step={1}
                    onValueChange={([value]) => setShortBreakDuration(value)}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Long Break</label>
                    <span>{formatTime(longBreakDuration)}</span>
                  </div>
                  <Slider
                    value={[longBreakDuration]}
                    min={1}
                    max={60 * 60}
                    step={1}
                    onValueChange={([value]) => setLongBreakDuration(value)}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="font-medium">Long Break Interval</label>
                    <span>{longBreakInterval} pomodoros</span>
                  </div>
                  <Slider
                    value={[longBreakInterval]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={([value]) => setLongBreakInterval(value)}
                  />
                </div>
                
                <Button onClick={saveSettings} className="w-full">
                  Save Settings
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Stay focused. Take breaks. Be productive.
        </div>
      </div>
    </div>
  );
}

export default App;
