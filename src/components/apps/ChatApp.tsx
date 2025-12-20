import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Avatar from '@mui/joy@5.0.0-beta.48/Avatar';
import { Send } from 'lucide-react';

const mockMessages = [
  { id: 1, sender: 'Alice', message: 'Hey, how are you?', time: '10:30 AM', isMe: false },
  { id: 2, sender: 'Me', message: 'Great! Working on the new project.', time: '10:32 AM', isMe: true },
  { id: 3, sender: 'Alice', message: 'Awesome! Let me know if you need help.', time: '10:35 AM', isMe: false }
];

export function ChatApp() {
  const [message, setMessage] = useState('');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Avatar size="sm">A</Avatar>
        <Typography level="title-md">Alice</Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {mockMessages.map(msg => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
              maxWidth: '70%'
            }}
          >
            <Box
              sx={{
                bgcolor: msg.isMe ? 'primary.softBg' : 'background.level1',
                p: 1.5,
                borderRadius: '12px'
              }}
            >
              <Typography level="body-sm">{msg.message}</Typography>
            </Box>
            <Typography level="body-xs" sx={{ color: 'text.tertiary', mt: 0.5 }}>
              {msg.time}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          sx={{ flex: 1 }}
          size="sm"
        />
        <IconButton size="sm">
          <Send size={16} />
        </IconButton>
      </Box>
    </Box>
  );
}