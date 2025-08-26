import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import type { BehaviorType, CreateBehaviorTypeInput } from '../../../server/src/schema';

interface BehaviorTypeManagerProps {
  behaviorTypes: BehaviorType[];
  onBehaviorTypeAdded: (behaviorType: BehaviorType) => void;
  onBehaviorTypesChanged: (behaviorTypes: BehaviorType[]) => void;
}

export function BehaviorTypeManager({ 
  behaviorTypes, 
  onBehaviorTypeAdded, 
  onBehaviorTypesChanged 
}: BehaviorTypeManagerProps) {
  const [formData, setFormData] = useState<CreateBehaviorTypeInput>({
    name: '',
    conspiracy_score: 5,
    is_custom: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const newBehaviorType = await trpc.createBehaviorType.mutate(formData);
      onBehaviorTypeAdded(newBehaviorType);
      
      // Reset form
      setFormData({
        name: '',
        conspiracy_score: 5,
        is_custom: true
      });
    } catch (error) {
      console.error('Failed to create behavior type:', error);
      alert('Failed to create behavior type. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteBehaviorType.mutate({ id });
      onBehaviorTypesChanged(behaviorTypes.filter((bt: BehaviorType) => bt.id !== id));
    } catch (error) {
      console.error('Failed to delete behavior type:', error);
      alert('Failed to delete behavior type. It may be in use by existing activities.');
    }
  };

  const getScoreDescription = (score: number): string => {
    if (score <= 2) return 'Harmless Quirk';
    if (score <= 4) return 'Mildly Suspicious';
    if (score <= 6) return 'Concerning Behavior';
    if (score <= 8) return 'Highly Suspicious';
    return 'MAXIMUM THREAT LEVEL';
  };

  const getScoreColor = (score: number): string => {
    if (score <= 3) return 'bg-green-500';
    if (score <= 5) return 'bg-yellow-500';
    if (score <= 7) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Add New Behavior Type */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ➕ Define New Suspicious Behavior
          </CardTitle>
          <CardDescription>
            Add a new type of behavior to the watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="behavior-name">Behavior Name *</Label>
              <Input
                id="behavior-name"
                placeholder="e.g., Prolonged Staring, Midnight Zoomies, Suspicious Purring"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateBehaviorTypeInput) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Conspiracy Score: {formData.conspiracy_score}/10</Label>
              <div className="px-2">
                <Slider
                  value={[formData.conspiracy_score]}
                  onValueChange={(value: number[]) =>
                    setFormData((prev: CreateBehaviorTypeInput) => ({
                      ...prev,
                      conspiracy_score: value[0]
                    }))
                  }
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>1 - Innocent</span>
                <span>10 - World Domination</span>
              </div>
              <Badge className={`${getScoreColor(formData.conspiracy_score)} text-white`}>
                {getScoreDescription(formData.conspiracy_score)}
              </Badge>
            </div>

            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? '⚡ Adding to Watchlist...' : '🎭 Add Behavior Type'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Existing Behavior Types */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎭 Current Behavior Types
          </CardTitle>
          <CardDescription>
            Manage your cat's suspicious behavior categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {behaviorTypes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🤷‍♂️</div>
              <p>No behavior types defined yet.</p>
              <p className="text-sm mt-2">Add some behaviors above to start tracking your cat's schemes!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {behaviorTypes.map((behaviorType: BehaviorType, index: number) => (
                <div key={behaviorType.id}>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{behaviorType.name}</h3>
                        <Badge className={`${getScoreColor(behaviorType.conspiracy_score)} text-white`}>
                          {behaviorType.conspiracy_score}/10
                        </Badge>
                        {!behaviorType.is_custom && (
                          <Badge variant="outline" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        Threat Level: {getScoreDescription(behaviorType.conspiracy_score)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Added: {behaviorType.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    
                    {behaviorType.is_custom && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            🗑️ Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Behavior Type?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{behaviorType.name}"? 
                              This action cannot be undone and may affect existing activity records.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(behaviorType.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  {index < behaviorTypes.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
