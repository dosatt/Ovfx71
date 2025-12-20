import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import { ArrowLeft, ArrowRight, RotateCw, Home } from 'lucide-react';

export function BrowserApp() {
  const [url, setUrl] = useState('https://example.com');

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* URL Bar */}
      <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <IconButton size="sm" variant="plain">
          <ArrowLeft size={16} />
        </IconButton>
        <IconButton size="sm" variant="plain">
          <ArrowRight size={16} />
        </IconButton>
        <IconButton size="sm" variant="plain">
          <RotateCw size={16} />
        </IconButton>
        <IconButton size="sm" variant="plain">
          <Home size={16} />
        </IconButton>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          sx={{ flex: 1 }}
          size="sm"
        />
      </Box>

      {/* Browser Content */}
      <Box sx={{ flex: 1, p: 4, overflow: 'auto' }}>
        <Box sx={{ textAlign: 'center', color: 'text.tertiary' }}>
          <p>Browser simulation</p>
          <p style={{ fontSize: '0.875rem' }}>Navigate to: {url}</p>
        </Box>
      </Box>
    </Box>
  );
}