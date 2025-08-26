import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import type { Plant, SunlightExposure, PlantMood } from '../../../server/src/schema';

interface PlantCardProps {
  plant: Plant;
  onEdit: (plant: Plant) => void;
  onDelete: (plantId: number) => void;
}

// Helper function to get mood emoji and color
const getMoodDisplay = (mood: PlantMood) => {
  const displays = {
    'Happy': { emoji: '😊', color: 'bg-green-100 text-green-800', label: 'Happy' },
    'Thirsty': { emoji: '😰', color: 'bg-yellow-100 text-yellow-800', label: 'Thirsty' },
    'Sun-deprived': { emoji: '😴', color: 'bg-blue-100 text-blue-800', label: 'Sun-deprived' },
    'Over-watered': { emoji: '🤢', color: 'bg-purple-100 text-purple-800', label: 'Over-watered' }
  };
  return displays[mood];
};

// Helper function to get sunlight emoji
const getSunlightEmoji = (exposure: SunlightExposure) => {
  const emojis = {
    'Low': '🌙',
    'Medium': '⛅',
    'High': '☀️'
  };
  return emojis[exposure];
};

// Helper function to format dates relative to now
const formatDate = (date: Date) => {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
};

export function PlantCard({ plant, onEdit, onDelete }: PlantCardProps) {
  const moodDisplay = getMoodDisplay(plant.mood);
  const sunlightEmoji = getSunlightEmoji(plant.sunlight_exposure);
  
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 bg-white/80 backdrop-blur-sm plant-card">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            🌿 {plant.name}
          </CardTitle>
          <Badge className={`${moodDisplay.color} border-0 text-xs font-medium`}>
            {moodDisplay.emoji} {moodDisplay.label}
          </Badge>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Added {plant.created_at.toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">💧 Last watered:</span>
          <span className="text-sm text-gray-600">{formatDate(plant.last_watered)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Sunlight:</span>
          <span className="text-sm text-gray-600 flex items-center gap-1">
            {sunlightEmoji} {plant.sunlight_exposure}
          </span>
        </div>
        
        <Separator />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(plant)}
            className="flex-1 hover:bg-green-50"
          >
            ✏️ Edit
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="hover:bg-red-50">
                🗑️ Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {plant.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently remove {plant.name} from your plant collection.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(plant.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Plant
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
