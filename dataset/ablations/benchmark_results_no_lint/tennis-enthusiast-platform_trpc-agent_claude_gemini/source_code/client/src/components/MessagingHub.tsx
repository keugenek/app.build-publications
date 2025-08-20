import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { ConversationSummary, Message, User, SendMessageInput } from '../../../server/src/schema';

interface MessagingHubProps {
  currentUserId: number;
}

export function MessagingHub({ currentUserId }: MessagingHubProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Demo data for conversations and messages since backend handlers are stubs
  const demoConversations: ConversationSummary[] = [
    {
      other_user: {
        id: 2,
        name: 'Sarah Wilson',
        email: 'sarah@example.com',
        skill_level: 'intermediate',
        location: 'San Francisco, CA',
        bio: 'Weekend warrior looking for doubles partners.',
        created_at: new Date('2024-01-15'),
        updated_at: new Date('2024-01-15')
      },
      last_message: {
        id: 1,
        sender_id: 2,
        recipient_id: currentUserId,
        content: 'Great! Looking forward to playing this Saturday at 10 AM.',
        created_at: new Date('2024-01-25T10:30:00'),
        read_at: null
      },
      unread_count: 1
    },
    {
      other_user: {
        id: 3,
        name: 'Mike Chen',
        email: 'mike@example.com',
        skill_level: 'advanced',
        location: 'San Francisco, CA',
        bio: 'Former college player.',
        created_at: new Date('2024-01-10'),
        updated_at: new Date('2024-01-10')
      },
      last_message: {
        id: 2,
        sender_id: currentUserId,
        recipient_id: 3,
        content: 'Thanks for the match! Let\'s play again soon.',
        created_at: new Date('2024-01-24T16:45:00'),
        read_at: new Date('2024-01-24T17:00:00')
      },
      unread_count: 0
    }
  ];

  const demoMessages: { [key: number]: Message[] } = {
    2: [
      {
        id: 3,
        sender_id: currentUserId,
        recipient_id: 2,
        content: 'Hi Sarah! I saw your profile and would love to play doubles sometime. Are you available this weekend?',
        created_at: new Date('2024-01-25T09:00:00'),
        read_at: new Date('2024-01-25T09:15:00')
      },
      {
        id: 4,
        sender_id: 2,
        recipient_id: currentUserId,
        content: 'Hi! Yes, I\'d love to play. Saturday morning works well for me. Do you have a preferred court?',
        created_at: new Date('2024-01-25T09:30:00'),
        read_at: new Date('2024-01-25T09:45:00')
      },
      {
        id: 5,
        sender_id: currentUserId,
        recipient_id: 2,
        content: 'Perfect! How about the courts at Golden Gate Park? Saturday 10 AM?',
        created_at: new Date('2024-01-25T10:00:00'),
        read_at: new Date('2024-01-25T10:15:00')
      },
      {
        id: 1,
        sender_id: 2,
        recipient_id: currentUserId,
        content: 'Great! Looking forward to playing this Saturday at 10 AM.',
        created_at: new Date('2024-01-25T10:30:00'),
        read_at: null
      }
    ],
    3: [
      {
        id: 6,
        sender_id: currentUserId,
        recipient_id: 3,
        content: 'Hey Mike! Great match today. Your backhand is incredible!',
        created_at: new Date('2024-01-24T16:30:00'),
        read_at: new Date('2024-01-24T16:35:00')
      },
      {
        id: 2,
        sender_id: currentUserId,
        recipient_id: 3,
        content: 'Thanks for the match! Let\'s play again soon.',
        created_at: new Date('2024-01-24T16:45:00'),
        read_at: new Date('2024-01-24T17:00:00')
      }
    ]
  };

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // Using demo data since backend is stub
      setConversations(demoConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (otherUserId: number) => {
    setIsLoading(true);
    try {
      // Using demo data since backend is stub
      const conversationMessages = demoMessages[otherUserId] || [];
      setMessages(conversationMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleConversationSelect = (conversation: ConversationSummary) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.other_user.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const messageData: SendMessageInput = {
        recipient_id: selectedConversation.other_user.id,
        content: newMessage.trim()
      };

      const sentMessage = await trpc.sendMessage.mutate({
        senderId: currentUserId,
        messageData
      });

      // Add message to current conversation
      setMessages((prev: Message[]) => [...prev, sentMessage]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const skillLevelColors = {
    beginner: 'bg-blue-100 text-blue-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  if (conversations.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">💬</div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No conversations yet</h3>
        <p className="text-gray-600 mb-4">
          Start conversations by messaging players from the "Find Players" tab!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      {/* Conversations List */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg">Your Conversations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="space-y-2 p-4">
              {conversations.map((conversation: ConversationSummary) => (
                <div
                  key={conversation.other_user.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedConversation?.other_user.id === conversation.other_user.id
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleConversationSelect(conversation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-700 font-semibold">
                          {conversation.other_user.name.charAt(0)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-800">
                            {conversation.other_user.name}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={skillLevelColors[conversation.other_user.skill_level]}
                          >
                            {conversation.other_user.skill_level}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          📍 {conversation.other_user.location}
                        </p>
                      </div>
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge className="bg-red-500 text-white">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>
                  
                  {conversation.last_message && (
                    <div className="mt-3 pl-13">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {conversation.last_message.content}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {conversation.last_message.created_at.toLocaleDateString()} {conversation.last_message.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Messages View */}
      <div className="lg:col-span-2">
        {selectedConversation ? (
          <Card className="border-gray-200 h-full flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold">
                    {selectedConversation.other_user.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <CardTitle className="text-lg">{selectedConversation.other_user.name}</CardTitle>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={skillLevelColors[selectedConversation.other_user.skill_level]}
                    >
                      {selectedConversation.other_user.skill_level}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      📍 {selectedConversation.other_user.location}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <Separator />
            
            {/* Messages */}
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-3 rounded-lg ${
                          message.sender_id === currentUserId
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender_id === currentUserId ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {message.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.sender_id === currentUserId && message.read_at && (
                            <span className="ml-2">✓✓</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1"
                    disabled={isSending}
                  />
                  <Button 
                    type="submit" 
                    disabled={isSending || !newMessage.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isSending ? '⏳' : '📤'}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200 h-full flex items-center justify-center">
            <CardContent className="text-center">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Select a conversation</h3>
              <p className="text-gray-600">Choose a conversation from the list to view messages</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
