import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { JlptLevel } from '../../../server/src/schema';

interface LevelSelectorProps {
  selectedLevel: JlptLevel;
  onLevelChange: (level: JlptLevel) => void;
}

const JLPT_LEVELS: { level: JlptLevel; name: string; description: string; color: string }[] = [
  {
    level: 'N5',
    name: 'Beginner',
    description: 'Basic kanji for daily use',
    color: 'bg-green-500 hover:bg-green-600'
  },
  {
    level: 'N4',
    name: 'Elementary',
    description: 'Essential kanji for basic communication',
    color: 'bg-blue-500 hover:bg-blue-600'
  },
  {
    level: 'N3',
    name: 'Intermediate',
    description: 'Kanji for everyday situations',
    color: 'bg-yellow-500 hover:bg-yellow-600'
  },
  {
    level: 'N2',
    name: 'Upper Intermediate',
    description: 'Advanced kanji for complex topics',
    color: 'bg-orange-500 hover:bg-orange-600'
  },
  {
    level: 'N1',
    name: 'Advanced',
    description: 'Expert-level kanji for academic use',
    color: 'bg-red-500 hover:bg-red-600'
  }
];

export function LevelSelector({ selectedLevel, onLevelChange }: LevelSelectorProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-800 text-center">Select JLPT Level</h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {JLPT_LEVELS.map((levelInfo) => (
              <Button
                key={levelInfo.level}
                onClick={() => onLevelChange(levelInfo.level)}
                variant={selectedLevel === levelInfo.level ? 'default' : 'outline'}
                className={`flex flex-col items-center p-3 h-auto ${
                  selectedLevel === levelInfo.level 
                    ? levelInfo.color + ' text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Badge 
                  variant="secondary" 
                  className={`mb-1 ${
                    selectedLevel === levelInfo.level 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100'
                  }`}
                >
                  {levelInfo.level}
                </Badge>
                <div className="text-xs font-medium">{levelInfo.name}</div>
                <div className="text-xs opacity-90 text-center leading-tight">
                  {levelInfo.description}
                </div>
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
