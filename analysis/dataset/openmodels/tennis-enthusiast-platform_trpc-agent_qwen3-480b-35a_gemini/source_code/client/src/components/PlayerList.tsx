import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Award } from 'lucide-react';
import type { UserProfile, SkillLevel } from '../../../server/src/schema';

interface PlayerListProps {
  profiles: UserProfile[];
}

export function PlayerList({ profiles }: PlayerListProps) {
  const getSkillBadgeVariant = (level: SkillLevel) => {
    switch (level) {
      case 'Beginner': return 'secondary';
      case 'Intermediate': return 'default';
      case 'Advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  if (profiles.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <p className="text-gray-500">No players found. Try adjusting your search or create a profile!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <Card key={profile.id} className="shadow-md hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{profile.name}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant={getSkillBadgeVariant(profile.skill_level)}>
                    {profile.skill_level}
                  </Badge>
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{profile.city}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-start md:items-end">
                <div className="flex items-center text-sm text-gray-500">
                  <Award className="h-4 w-4 mr-1" />
                  <span>Member since {profile.created_at.toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
