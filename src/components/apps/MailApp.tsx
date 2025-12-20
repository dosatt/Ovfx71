import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Button from '@mui/joy@5.0.0-beta.48/Button';
import { Plus, Inbox, Send, Archive, Trash2 } from 'lucide-react';

const mockEmails = [
  { id: 1, from: 'John Doe', subject: 'Meeting Tomorrow', preview: 'Hi, just wanted to confirm...', time: '10:30 AM' },
  { id: 2, from: 'Jane Smith', subject: 'Project Update', preview: 'The latest update on the project...', time: '9:15 AM' },
  { id: 3, from: 'Team', subject: 'Weekly Review', preview: 'Please review the weekly report...', time: 'Yesterday' }
];

export function MailApp() {
  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* Sidebar */}
      <Box sx={{ 
        width: 200, 
        borderRight: '1px solid', 
        borderColor: 'divider',
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}>
        <Button startDecorator={<Plus size={16} />} size="sm" fullWidth>
          Compose
        </Button>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 2 }}>
          <Button variant="soft" size="sm" startDecorator={<Inbox size={16} />} sx={{ justifyContent: 'flex-start' }}>
            Inbox
          </Button>
          <Button variant="plain" size="sm" startDecorator={<Send size={16} />} sx={{ justifyContent: 'flex-start' }}>
            Sent
          </Button>
          <Button variant="plain" size="sm" startDecorator={<Archive size={16} />} sx={{ justifyContent: 'flex-start' }}>
            Archive
          </Button>
          <Button variant="plain" size="sm" startDecorator={<Trash2 size={16} />} sx={{ justifyContent: 'flex-start' }}>
            Trash
          </Button>
        </Box>
      </Box>

      {/* Email list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {mockEmails.map(email => (
          <Box
            key={email.id}
            sx={{
              p: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              cursor: 'pointer',
              '&:hover': {
                bgcolor: 'background.level1'
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography level="title-sm">{email.from}</Typography>
              <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                {email.time}
              </Typography>
            </Box>
            <Typography level="body-sm" sx={{ mb: 0.5 }}>{email.subject}</Typography>
            <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
              {email.preview}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}