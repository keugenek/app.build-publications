import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { UserProfile } from '../../../server/src/schema';

interface PlayerCardProps {
  player: UserProfile;
  onMessageClick: (player: UserProfile) => void;
}

export function PlayerCard({ player, onMessageClick }: PlayerCardProps) {
  const getSkillBadgeVariant = (skill: string) => {
    switch (skill) {
      case 'beginner': return 'secondary';
      case 'intermediate': return 'default';
      case 'advanced': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium">{player.name}</div>
          <div className="text-sm text-gray-500">{player.location}</div>
          <Badge variant={getSkillBadgeVariant(player.skill_level)} className="mt-1">
            {player.skill_level}
          </Badge>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={() => onMessageClick(player)}>
        Message
      </Button>
    </div>
  );
}
