import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Calendar, MessageCircle, User, Send } from 'lucide-react';

// Import types from server
import type { UserProfile } from '../../../server/src/schema';

interface PlayerCardProps {
  player: UserProfile;
  currentUser?: UserProfile | null;
  isCurrentUser?: boolean;
  onSendConnectionRequest?: (receiverId: number, message?: string) => Promise<void>;
}

const skillColors = {
  Beginner: 'bg-green-100 text-green-800 border-green-200',
  Intermediate: 'bg-blue-100 text-blue-800 border-blue-200',
  Advanced: 'bg-purple-100 text-purple-800 border-purple-200'
};

const skillEmojis = {
  Beginner: '🌱',
  Intermediate: '🎾',
  Advanced: '🏆'
};

export function PlayerCard({ player, currentUser, isCurrentUser = false, onSendConnectionRequest }: PlayerCardProps) {
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleSendRequest = async () => {
    if (!onSendConnectionRequest || !currentUser) return;
    
    setIsSending(true);
    try {
      await onSendConnectionRequest(player.id, connectionMessage.trim() || undefined);
      setConnectionMessage('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to send connection request:', error);
    } finally {
      setIsSending(false);
    }
  };

  const canSendRequest = currentUser && !isCurrentUser && currentUser.id !== player.id;

  return (
    <Card className="h-full hover:shadow-md transition-shadow duration-200 border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {player.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {player.name}
                {isCurrentUser && <span className="ml-2 text-sm text-green-600">(You)</span>}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                {player.location}
              </div>
            </div>
          </div>
          
          <Badge 
            variant="outline" 
            className={`${skillColors[player.skill_level]} font-medium`}
          >
            <span className="mr-1">{skillEmojis[player.skill_level]}</span>
            {player.skill_level}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Bio */}
        {player.bio && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
              {player.bio}
            </p>
          </div>
        )}

        {/* Member Since */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>Member since {player.created_at.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
          })}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {isCurrentUser ? (
            <Badge variant="secondary" className="w-full justify-center py-2">
              <User className="h-4 w-4 mr-2" />
              Your Profile
            </Badge>
          ) : canSendRequest ? (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Connect
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    Connect with {player.name}
                  </DialogTitle>
                  <DialogDescription className="text-left">
                    Send a connection request to start playing tennis together! 
                    You can include a personalized message.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {/* Player Info Summary */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{player.name}</p>
                        <p className="text-xs text-gray-600 flex items-center gap-1">
                          <span>{skillEmojis[player.skill_level]}</span>
                          {player.skill_level} • {player.location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="space-y-2">
                    <Label htmlFor="connection-message">Message (Optional)</Label>
                    <Textarea
                      id="connection-message"
                      placeholder="Hi! I'd love to play tennis with you. Let me know when you're available..."
                      value={connectionMessage}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                        setConnectionMessage(e.target.value)
                      }
                      rows={3}
                      maxLength={300}
                      className="resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right">
                      {connectionMessage.length}/300
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendRequest}
                    disabled={isSending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          ) : (
            <Button variant="outline" disabled className="w-full">
              {!currentUser ? 'Create profile to connect' : 'Cannot connect'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
