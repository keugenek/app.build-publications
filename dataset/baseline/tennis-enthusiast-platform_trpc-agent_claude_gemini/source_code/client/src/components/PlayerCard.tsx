import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { UserProfile } from '../../../server/src/schema';

interface PlayerCardProps {
  profile: UserProfile;
  variant?: 'default' | 'search-result';
  onConnect?: (profileId: number) => void;
}

export function PlayerCard({ profile, variant = 'default', onConnect }: PlayerCardProps) {
  const isSearchResult = variant === 'search-result';
  
  const gradientClass = isSearchResult 
    ? 'from-white to-teal-50/30 hover:from-teal-50 hover:to-emerald-50'
    : 'from-white to-emerald-50/30 hover:from-emerald-50 hover:to-teal-50';
    
  const avatarGradient = isSearchResult
    ? 'from-teal-400 to-emerald-400'
    : 'from-emerald-400 to-teal-400';
    
  const badgeGradient = isSearchResult
    ? 'from-teal-50 to-emerald-50 border-teal-200 text-teal-700'
    : 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700';
    
  const buttonGradient = isSearchResult
    ? 'from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600'
    : 'from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600';

  const hoverTextColor = isSearchResult 
    ? 'group-hover:text-teal-700' 
    : 'group-hover:text-emerald-700';

  const handleConnect = () => {
    if (onConnect) {
      onConnect(profile.id);
    }
  };

  return (
    <Card className={`group hover:shadow-lg transition-all duration-300 border-0 shadow-md bg-gradient-to-br ${gradientClass} tennis-card`}>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className={`w-12 h-12 bg-gradient-to-r ${avatarGradient} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md float-animation`}>
            {profile.name.charAt(0).toUpperCase()}
          </div>
          {isSearchResult ? (
            <Badge className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-sm">
              Match! 🎯
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 hipster-badge">
              Active
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className={`text-xl text-slate-800 ${hoverTextColor} transition-colors`}>
            {profile.name}
          </CardTitle>
          <CardDescription className="text-slate-600 flex items-center space-x-1">
            <span>📍</span>
            <span>{profile.location}</span>
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-slate-700">Skill Level:</span>
          </div>
          <Badge variant="outline" className={`bg-gradient-to-r ${badgeGradient} hipster-badge`}>
            {profile.skill_level}
          </Badge>
        </div>
        <Separator className="bg-gradient-to-r from-emerald-100 to-teal-100" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Joined {profile.created_at.toLocaleDateString()}
          </span>
          <Button 
            size="sm" 
            onClick={handleConnect}
            className={`bg-gradient-to-r ${buttonGradient} text-white shadow-sm tennis-button`}
          >
            Connect 🤝
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
