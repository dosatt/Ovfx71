import { useState } from 'react';
import { Input, ScrollShadow } from '@heroui/react';
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
    <div className="w-full">
      <Input
        placeholder="Cerca icona..."
        value={search}
        onValueChange={setSearch}
        size="sm"
        className="mb-3"
      />
      <ScrollShadow className="h-[200px] w-full p-1 border border-divider rounded-medium">
        <div className="grid grid-cols-7 gap-1">
          {filteredIcons.map((iconName) => {
            const IconComponent = (LucideIcons as any)[iconName];
            if (!IconComponent) return null;
            
            return (
              <div
                key={iconName}
                onClick={() => handleIconSelect(iconName)}
                className={`
                  flex items-center justify-center aspect-square rounded-small cursor-pointer transition-all
                  hover:bg-primary/20 hover:text-primary
                  ${currentIcon === iconName ? 'bg-primary/20 ring-2 ring-primary ring-offset-0 text-primary' : 'text-default-500'}
                `}
              >
                <IconComponent size={20} />
              </div>
            );
          })}
        </div>
        {filteredIcons.length === 0 && (
          <p className="text-center text-tiny text-default-400 py-4">
            Nessuna icona trovata
          </p>
        )}
      </ScrollShadow>
      
      {onColorChange && (
        <>
          <p className="text-small text-default-500 mb-2 mt-3">
            Colore
          </p>
          <div className="grid grid-cols-6 gap-2">
            {colorPresets.map((color) => (
              <div
                key={color.name}
                onClick={() => handleColorSelect(color.value)}
                className={`
                  relative flex items-center justify-center aspect-square rounded-small cursor-pointer transition-transform hover:scale-105 border border-divider
                  ${currentColor === color.value ? 'ring-2 ring-primary ring-offset-1' : ''}
                `}
                style={{ backgroundColor: color.value }}
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
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
