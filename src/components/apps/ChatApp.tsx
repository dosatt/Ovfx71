import { useState } from 'react';
import { Input, Avatar, Button } from '@heroui/react';
import { Send } from 'lucide-react';

const mockMessages = [
  { id: 1, sender: 'Alice', message: 'Hey, how are you?', time: '10:30 AM', isMe: false },
  { id: 2, sender: 'Me', message: 'Great! Working on the new project.', time: '10:32 AM', isMe: true },
  { id: 3, sender: 'Alice', message: 'Awesome! Let me know if you need help.', time: '10:35 AM', isMe: false }
];

export function ChatApp() {
  const [message, setMessage] = useState('');

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="p-4 border-b border-divider flex items-center gap-3">
        <Avatar name="A" size="sm" />
        <h4 className="text-medium font-semibold">Alice</h4>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 flex flex-col gap-4">
        {mockMessages.map(msg => (
          <div
            key={msg.id}
            className={`
              flex flex-col max-w-[70%]
              ${msg.isMe ? 'self-end items-end' : 'self-start items-start'}
            `}
          >
            <div
              className={`
                p-3 rounded-xl text-small
                ${msg.isMe ? 'bg-primary text-primary-foreground' : 'bg-default-100 text-default-900'}
              `}
            >
              {msg.message}
            </div>
            <span className="text-tiny text-default-400 mt-1 px-1">
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-divider flex gap-2 items-center">
        <Input
          value={message}
          onValueChange={setMessage}
          placeholder="Type a message..."
          className="flex-1"
          size="sm"
          classNames={{
            inputWrapper: "bg-default-100",
          }}
        />
        <Button isIconOnly size="sm" color="primary">
          <Send size={16} />
        </Button>
      </div>
    </div>
  );
}
