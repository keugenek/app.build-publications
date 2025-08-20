import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Coffee, Clock } from 'lucide-react';
// Using type-only imports
import type { WorkSession as WorkSessionType } from '../../../server/src/schema';

interface WorkSessionProps {
  activeSession: WorkSessionType | null;
  onStartWork: () => void;
  onStartBreak: () => void;
  onEndSession: () => void;
}

export function WorkSession({ activeSession, onStartWork, onStartBreak, onEndSession }: WorkSessionProps) {
  const [sessionDuration, setSessionDuration] = useState<string>('00:00:00');

  // Update session duration every second
  useEffect(() => {
    if (!activeSession) {
      setSessionDuration('00:00:00');
      return;
    }

    const updateDuration = () => {
      const startTime = new Date(activeSession.start_time);
      const now = new Date();
      const diffMs = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setSessionDuration(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
    };

    updateDuration(); // Initial update
    const interval = setInterval(updateDuration, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const getSessionStatus = () => {
    if (!activeSession) {
      return {
        status: 'No active session',
        color: 'bg-gray-100 text-gray-700',
        icon: <Clock className="w-4 h-4" />
      };
    }

    if (activeSession.is_break) {
      return {
        status: 'On Break',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: <Coffee className="w-4 h-4" />
      };
    }

    return {
      status: 'Working',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: <Play className="w-4 h-4" />
    };
  };

  const sessionInfo = getSessionStatus();

  return (
    <div className="space-y-4">
      {/* Current Session Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge className={`${sessionInfo.color} border flex items-center gap-2`}>
            {sessionInfo.icon}
            {sessionInfo.status}
          </Badge>
          {activeSession && (
            <div className="text-lg font-mono font-bold text-gray-800">
              {sessionDuration}
            </div>
          )}
        </div>

        {activeSession && (
          <Button 
            onClick={onEndSession}
            variant="outline"
            size="sm"
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <Square className="w-4 h-4 mr-2" />
            End Session
          </Button>
        )}
      </div>

      {/* Session Controls */}
      <div className="flex gap-3">
        {!activeSession && (
          <Button 
            onClick={onStartWork}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Work
          </Button>
        )}

        {activeSession && !activeSession.is_break && (
          <Button 
            onClick={onStartBreak}
            variant="outline"
            className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50"
          >
            <Coffee className="w-4 h-4 mr-2" />
            Take Break
          </Button>
        )}

        {activeSession && activeSession.is_break && (
          <Button 
            onClick={onStartWork}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Play className="w-4 h-4 mr-2" />
            Resume Work
          </Button>
        )}
      </div>

      {/* Session Info */}
      {activeSession && (
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Session started:</span>
            <span>
              {new Date(activeSession.start_time).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Session type:</span>
            <span className="flex items-center gap-1">
              {activeSession.is_break ? (
                <>
                  <Coffee className="w-3 h-3" />
                  Break Session
                </>
              ) : (
                <>
                  <Play className="w-3 h-3" />
                  Work Session
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <div className="font-medium mb-1">💡 Break Recommendations:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>Take a 5-15 minute break every 2-3 hours</li>
          <li>Step away from your workspace during breaks</li>
          <li>Hydrate and stretch to maintain focus</li>
          <li>Long breaks (30+ minutes) after 4+ hours of work</li>
        </ul>
      </div>
    </div>
  );
}
