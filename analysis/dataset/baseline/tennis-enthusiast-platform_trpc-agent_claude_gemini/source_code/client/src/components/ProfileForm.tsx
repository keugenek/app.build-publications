import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import type { CreateUserProfileInput, UserProfile } from '../../../server/src/schema';

interface ProfileFormProps {
  onSubmit: (data: CreateUserProfileInput) => Promise<void>;
  isLoading?: boolean;
  currentUser?: UserProfile | null;
}

export function ProfileForm({ onSubmit, isLoading = false, currentUser }: ProfileFormProps) {
  const [formData, setFormData] = useState<CreateUserProfileInput>({
    name: '',
    skill_level: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
    // Reset form after successful submission
    setFormData({
      name: '',
      skill_level: '',
      location: ''
    });
  };

  if (currentUser) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 glass-card">
          <CardHeader className="text-center space-y-4">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg float-animation">
              <span className="text-3xl font-bold">{currentUser.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl gradient-text">Welcome back, {currentUser.name}! 🎾</CardTitle>
              <CardDescription className="text-lg">
                Your profile is active and ready to connect
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Name</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-slate-700">
                  {currentUser.name}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Location</label>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-slate-700 flex items-center space-x-2">
                  <span>📍</span>
                  <span>{currentUser.location}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Skill Level</label>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-slate-700 flex items-center space-x-2">
                <span>🏆</span>
                <span>{currentUser.skill_level}</span>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
              <p className="text-sm text-slate-600">
                💡 Profile editing will be available in the next update!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/20 glass-card">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white mx-auto shadow-lg tennis-bounce">
            <span className="text-3xl">🎾</span>
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl gradient-text">Join the Community</CardTitle>
            <CardDescription className="text-lg">
              Tell us about yourself to find the perfect tennis partners
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <span>👤</span>
                <span>Full Name</span>
              </label>
              <Input
                placeholder="Your name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, name: e.target.value }))
                }
                required
                className="tennis-input border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <span>🏆</span>
                <span>Skill Level</span>
              </label>
              <Input
                placeholder="e.g., Beginner, Intermediate, Advanced, USTA 4.0, etc."
                value={formData.skill_level}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, skill_level: e.target.value }))
                }
                required
                className="tennis-input border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
              <p className="text-xs text-slate-500 flex items-center space-x-1">
                <span>💡</span>
                <span>Describe your playing level - be honest to find great matches!</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center space-x-2">
                <span>📍</span>
                <span>Location</span>
              </label>
              <Input
                placeholder="City, State (e.g., Austin, TX)"
                value={formData.location}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: CreateUserProfileInput) => ({ ...prev, location: e.target.value }))
                }
                required
                className="tennis-input border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isLoading} 
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg text-lg py-6 tennis-button"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <span>🔄</span>
                  <span>Creating Profile...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span>🚀</span>
                  <span>Create Profile</span>
                </span>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
