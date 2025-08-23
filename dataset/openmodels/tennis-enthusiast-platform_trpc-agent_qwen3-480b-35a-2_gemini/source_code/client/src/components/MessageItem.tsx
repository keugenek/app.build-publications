import type { Message } from '../../../server/src/schema';

interface MessageItemProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageItem({ message, isCurrentUser }: MessageItemProps) {
  return (
    <div 
      className={`p-3 rounded-lg max-w-[80%] ${
        isCurrentUser 
          ? 'ml-auto bg-green-100 text-green-900' 
          : 'mr-auto bg-white border'
      }`}
    >
      <p>{message.content}</p>
      <p className="text-xs mt-1 opacity-70">
        {message.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </p>
    </div>
  );
}
