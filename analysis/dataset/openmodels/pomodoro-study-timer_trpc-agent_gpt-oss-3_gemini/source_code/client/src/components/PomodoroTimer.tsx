import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import type { PomodoroSettings, PomodoroLog, CreatePomodoroLogInput, CreatePomodoroSettingsInput, UpdatePomodoroSettingsInput } from '../../../server/src/schema';

// Simple beep sound using public domain audio URL
const beepUrl = 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg';

export function PomodoroTimer() {
  // Settings state
  const [settings, setSettings] = useState<PomodoroSettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Timer state
  const [phase, setPhase] = useState<'work' | 'break'>('work');
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);

  // Logs
  const [logs, setLogs] = useState<PomodoroLog[]>([]);

  // Refs for interval
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load settings on mount
  const loadSettings = useCallback(async () => {
    const data = await trpc.getPomodoroSettings.query();
    setSettings(data);
    // Initialize timer seconds for work phase
    setSecondsLeft(data.work_interval * 60);
  }, []);

  useEffect(() => {
    loadSettings();
    // Load logs
    (async () => {
      const data = await trpc.getPomodoroLogs.query();
      setLogs(data);
    })();
  }, [loadSettings]);

  // Helper to play sound
  const playBeep = () => {
    const audio = new Audio(beepUrl);
    audio.play().catch(() => {}); // swallow errors if autoplay blocked
  };

  // Handle timer tick
  useEffect(() => {
    if (!isRunning) return;
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // Phase completed
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          // Play beep for end of phase
          playBeep();
          if (phase === 'work') {
            // Log the completed work session
            const logInput: CreatePomodoroLogInput = {
              work_duration: settings?.work_interval ?? 25,
              break_duration: settings?.break_interval ?? 5,
            };
            trpc.createPomodoroLog.mutate(logInput).then((newLog) => {
              setLogs((prev) => [newLog, ...prev]);
            });
            // Switch to break
            setPhase('break');
            setSecondsLeft((settings?.break_interval ?? 5) * 60);
          } else {
            // Switch back to work
            setPhase('work');
            setSecondsLeft((settings?.work_interval ?? 25) * 60);
          }
          // Auto‑start next phase
          setIsRunning(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [isRunning, phase, settings]);

  // Start / Pause button handler
  const toggleRunning = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      // If timer hasn't been started yet, ensure secondsLeft is set
      if (secondsLeft === 0 && settings) {
        setPhase('work');
        setSecondsLeft(settings.work_interval * 60);
      }
      setIsRunning(true);
      // Play start beep
      playBeep();
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    if (settings) {
      setPhase('work');
      setSecondsLeft(settings.work_interval * 60);
    }
  };

  // Handle settings change
  const handleSettingsChange = (field: keyof CreatePomodoroSettingsInput, value: string) => {
    if (!settings) return;
    const num = parseInt(value, 10);
    setSettings({
      ...settings,
      [field]: Number.isNaN(num) ? settings[field] : num,
    } as PomodoroSettings);
  };

  // Save settings mutation
  const saveSettings = async () => {
    if (!settings) return;
    setIsSavingSettings(true);
    const input: UpdatePomodoroSettingsInput = {
      id: settings.id,
      work_interval: settings.work_interval,
      break_interval: settings.break_interval,
    };
    await trpc.updatePomodoroSettings.mutate(input);
    setIsSavingSettings(false);
    // Reset timer with new values
    resetTimer();
  };

  // Format seconds to MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      {/* Timer Display */}
      <Card className="text-center p-6">
        <CardHeader>
          <CardTitle className="text-2xl font-bold capitalize">{phase} Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-5xl font-mono mb-4" data-testid="timer-display">
            {formatTime(secondsLeft)}
          </div>
          <div className="flex justify-center gap-4">
            <Button onClick={toggleRunning}>{isRunning ? 'Pause' : 'Start'}</Button>
            <Button variant="outline" onClick={resetTimer}>Reset</Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <label className="w-32" htmlFor="work_interval">Work minutes</label>
            <Input
              id="work_interval"
              type="number"
              min={1}
              max={90}
              value={settings?.work_interval ?? ''}
              onChange={(e) => handleSettingsChange('work_interval', e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <label className="w-32" htmlFor="break_interval">Break minutes</label>
            <Input
              id="break_interval"
              type="number"
              min={1}
              max={30}
              value={settings?.break_interval ?? ''}
              onChange={(e) => handleSettingsChange('break_interval', e.target.value)}
            />
          </div>
          <Button onClick={saveSettings} disabled={isSavingSettings}>
            {isSavingSettings ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      {/* Log */}
      <Card>
        <CardHeader>
          <CardTitle>Session Log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-60 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No sessions logged yet.</p>
          ) : (
            <ul>
              {logs.map((log) => (
                <li key={log.id} className="flex justify-between text-sm border-b py-1">
                  <span>{new Date(log.started_at).toLocaleString()}</span>
                  <span>{log.work_duration} min</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
