import { useState } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Input from '@mui/joy@5.0.0-beta.48/Input';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import * as LucideIcons from 'lucide-react';
import { Check } from 'lucide-react';

interface IconPickerProps {
  currentIcon?: string;
  currentColor?: string;
  onIconChange: (icon: string) => void;
  onColorChange?: (color: string) => void;
}

// Lista delle icone più comuni e utili
const popularIcons = [
  'FileText', 'Folder', 'Star', 'Heart', 'Home', 'Settings', 'User', 'Users',
  'Mail', 'MessageSquare', 'Phone', 'Calendar', 'Clock', 'Bell', 'Camera',
  'Image', 'Music', 'Video', 'File', 'FolderOpen', 'Archive', 'Bookmark',
  'Tag', 'Hash', 'AtSign', 'DollarSign', 'Percent', 'Code', 'Terminal',
  'Database', 'Server', 'Cloud', 'Download', 'Upload', 'Share', 'Link',
  'Paperclip', 'Edit', 'Trash', 'Copy', 'Clipboard', 'Check', 'X',
  'Plus', 'Minus', 'Search', 'Filter', 'Zap', 'Activity', 'TrendingUp',
  'BarChart', 'PieChart', 'Layout', 'Grid', 'List', 'Table', 'Layers',
  'Map', 'Navigation', 'Compass', 'Target', 'Flag', 'Award',
  'Gift', 'ShoppingCart', 'ShoppingBag', 'CreditCard', 'Package', 'Truck',
  'Book', 'BookOpen', 'Newspaper', 'FileCode', 'Pencil', 'Palette', 'Sparkles',
  'Sun', 'Moon', 'CloudRain', 'Wind', 'Snowflake', 'Flame', 'Droplet',
  'Coffee', 'Pizza', 'Apple', 'Cake', 'IceCream', 'Wine', 'Beer',
  'Gamepad', 'Headphones', 'Mic', 'Radio', 'Tv', 'Monitor',
  'Smartphone', 'Tablet', 'Laptop', 'Watch', 'Wifi', 'Battery', 'Plug',
  'Lock', 'Unlock', 'Key', 'Shield', 'Eye', 'EyeOff', 'AlertCircle',
  'Info', 'HelpCircle', 'CheckCircle', 'XCircle', 'AlertTriangle',
  'Smile', 'Frown', 'Meh', 'ThumbsUp', 'ThumbsDown', 'Rocket'
];

const colorPresets = [
  { name: 'Verde', value: '#01BC2B' },
  { name: 'Turchese', value: '#05BCC6' },
  { name: 'Blu', value: '#0181BE' },
  { name: 'Azzurro', value: '#039CF6' },
  { name: 'Giallo', value: '#F8D501' },
  { name: 'Arancio', value: '#FF9900' },
  { name: 'Rosso', value: '#FF0100' },
  { name: 'Viola', value: '#9D01FD' },
  { name: 'Grigio scuro', value: '#474747' },
  { name: 'Grigio medio', value: '#9B9B9B' },
  { name: 'Bianco', value: '#FFFFFF' },
  { name: 'Nero', value: '#000000' }
];

export function IconPicker({ currentIcon, currentColor, onIconChange, onColorChange }: IconPickerProps) {
  const [search, setSearch] = useState('');

  const filteredIcons = popularIcons.filter(name => 
    name.toLowerCase().includes(search.toLowerCase())
  );

  const handleIconSelect = (iconName: string) => {
    onIconChange(iconName);
  };

  const handleColorSelect = (color: string) => {
    if (onColorChange) {
      onColorChange(color);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Input
        placeholder="Cerca icona..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="sm"
        sx={{ mb: 1.5 }}
      />
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gridAutoRows: '40px',
          gap: 0.5,
          height: 200,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 0.5,
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: '4px'
          }
        }}
      >
        {filteredIcons.map((iconName) => {
          const IconComponent = (LucideIcons as any)[iconName];
          if (!IconComponent) return null;
          
          return (
            <Box
              key={iconName}
              onClick={() => handleIconSelect(iconName)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                borderRadius: 'sm',
                cursor: 'pointer',
                transition: 'all 0.2s',
                bgcolor: currentIcon === iconName ? 'primary.softBg' : 'transparent',
                outline: currentIcon === iconName ? '2px solid' : 'none',
                outlineColor: 'primary.solidBg',
                outlineOffset: '-2px',
                '&:hover': {
                  bgcolor: 'primary.softBg',
                  color: 'primary.solidBg'
                }
              }}
            >
              <IconComponent size={20} />
            </Box>
          );
        })}
      </Box>
      {filteredIcons.length === 0 && (
        <Typography level="body-sm" sx={{ textAlign: 'center', color: 'text.tertiary', py: 2 }}>
          Nessuna icona trovata
        </Typography>
      )}
      
      {onColorChange && (
        <>
          <Typography level="body-sm" sx={{ mb: 1, mt: 1.5 }}>
            Colore
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gridTemplateRows: 'repeat(2, 36px)',
              gap: 0.75
            }}
          >
            {colorPresets.map((color) => (
              <Box
                key={color.name}
                onClick={() => handleColorSelect(color.value)}
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 'sm',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  bgcolor: color.value || 'neutral.softBg',
                  outline: currentColor === color.value ? '3px solid' : 'none',
                  outlineColor: 'primary.solidBg',
                  outlineOffset: '-3px',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
                title={color.name}
              >
                {currentColor === color.value && (
                  <Check 
                    size={16} 
                    style={{ 
                      color: color.value === '#FFFFFF' ? '#000' : '#fff',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))'
                    }} 
                  />
                )}
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
}