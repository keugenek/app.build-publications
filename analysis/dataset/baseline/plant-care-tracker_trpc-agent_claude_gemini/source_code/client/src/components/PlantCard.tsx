import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Droplets, Sun, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { PlantWithMood, UpdatePlantInput, LightExposure, PlantMood } from '../../../server/src/schema';

interface PlantCardProps {
  plant: PlantWithMood;
  onWater: (plantId: number) => Promise<void>;
  onUpdate: (plantId: number, updates: Partial<UpdatePlantInput>) => Promise<void>;
  onDelete: (plantId: number) => Promise<void>;
  isLoading: boolean;
}

export function PlantCard({ plant, onWater, onUpdate, onDelete, isLoading }: PlantCardProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: plant.name,
    type: plant.type,
    light_exposure: plant.light_exposure
  });

  const getMoodEmoji = (mood: PlantMood): string => {
    switch (mood) {
      case 'Happy':
        return '😊';
      case 'Thirsty':
        return '😅';
      case 'Needs Sun':
        return '😴';
      case 'Wilting':
        return '😵';
      default:
        return '🌱';
    }
  };

  const getMoodColor = (mood: PlantMood): string => {
    switch (mood) {
      case 'Happy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Thirsty':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Needs Sun':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Wilting':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMoodMessage = (mood: PlantMood): string => {
    switch (mood) {
      case 'Happy':
        return 'Your plant is thriving! Keep up the great work! 🌟';
      case 'Thirsty':
        return 'Time for a drink! Your plant needs some water 💧';
      case 'Needs Sun':
        return 'Move me to a brighter spot, please! ☀️';
      case 'Wilting':
        return 'Help! I need water AND more light! 🆘';
      default:
        return 'Taking care of your green friend 🌱';
    }
  };

  const getDaysSinceWatered = (lastWatered: Date): number => {
    const now = new Date();
    return Math.floor((now.getTime() - lastWatered.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getLightIcon = (exposure: LightExposure) => {
    switch (exposure) {
      case 'low':
        return '🌑';
      case 'medium':
        return '🌤️';
      case 'high':
        return '☀️';
      default:
        return '☀️';
    }
  };

  const handleUpdate = async () => {
    await onUpdate(plant.id, editData);
    setShowEditDialog(false);
  };

  const handleDelete = async () => {
    await onDelete(plant.id);
    setShowDeleteDialog(false);
  };

  return (
    <Card className="shadow-lg border-green-200 hover:shadow-xl transition-all duration-300 plant-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 text-lg flex items-center gap-2">
            🌿 {plant.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={`${getMoodColor(plant.mood)} text-sm px-2 py-1`}>
              {getMoodEmoji(plant.mood)} {plant.mood}
            </Badge>
            
            {/* Edit Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Settings className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Edit {plant.name}
                  </DialogTitle>
                  <DialogDescription>
                    Update your plant's information
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={editData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditData(prev => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Input
                      value={editData.type}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditData(prev => ({ ...prev, type: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Light Exposure</label>
                    <Select
                      value={editData.light_exposure || 'medium'}
                      onValueChange={(value: LightExposure) =>
                        setEditData(prev => ({ ...prev, light_exposure: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🌑 Low Light</SelectItem>
                        <SelectItem value="medium">🌤️ Medium Light</SelectItem>
                        <SelectItem value="high">☀️ High Light</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpdate} disabled={isLoading}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="h-4 w-4" />
                    Delete {plant.name}?
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove this plant from your collection? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                    Delete Plant
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription className="text-green-600">
          {plant.type}
        </CardDescription>
        <div className="text-xs text-green-500 font-medium italic">
          {getMoodMessage(plant.mood)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <Droplets className="h-4 w-4" />
              Last watered:
            </span>
            <span className="font-medium">
              {getDaysSinceWatered(plant.last_watered_date) === 0
                ? 'Today'
                : `${getDaysSinceWatered(plant.last_watered_date)} days ago`}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <Sun className="h-4 w-4" />
              Light exposure:
            </span>
            <span className="font-medium flex items-center gap-1">
              {getLightIcon(plant.light_exposure)} {plant.light_exposure}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-green-700">
              <CalendarIcon className="h-4 w-4" />
              Added:
            </span>
            <span className="font-medium">
              {plant.created_at.toLocaleDateString()}
            </span>
          </div>

          <Button
            onClick={() => onWater(plant.id)}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white mt-4 water-btn"
            size="sm"
          >
            <Droplets className="h-4 w-4 mr-1" />
            💧 Water Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
