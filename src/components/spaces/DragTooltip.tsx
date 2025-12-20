import { Box, Typography } from '@mui/joy@5.0.0-beta.48';
import { Link2, Copy, MoveRight } from 'lucide-react';

interface DragTooltipProps {
  mode: 'link' | 'duplicate' | 'move';
}

export function DragTooltip({ mode }: DragTooltipProps) {
  const modeConfig = {
    link: {
      icon: Link2,
      title: 'Collega',
      description: 'Crea un link nell\'altro space',
      color: 'primary',
    },
    duplicate: {
      icon: Copy,
      title: 'Duplica',
      description: 'Crea una copia indipendente',
      color: 'success',
    },
    move: {
      icon: MoveRight,
      title: 'Sposta',
      description: 'Rimuove dall\'originale',
      color: 'warning',
    },
  };

  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        bgcolor: 'background.popup',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: '12px',
        px: 3,
        py: 2,
        boxShadow: 'lg',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        minWidth: 320,
      }}
    >
      {/* Current mode */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '8px',
            bgcolor: `${config.color}.softBg`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} style={{ color: `var(--joy-palette-${config.color}-500)` }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography level="title-sm" sx={{ fontWeight: 600 }}>
            {config.title}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {config.description}
          </Typography>
        </Box>
      </Box>

      {/* Divider */}
      <Box sx={{ height: '1px', bgcolor: 'divider' }} />

      {/* Shortcuts */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography 
            level="body-xs" 
            sx={{ 
              fontFamily: 'monospace',
              bgcolor: 'background.level1',
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            Alt
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            Duplica elemento
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography 
            level="body-xs" 
            sx={{ 
              fontFamily: 'monospace',
              bgcolor: 'background.level1',
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            Shift
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            Sposta elemento
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography 
            level="body-xs" 
            sx={{ 
              fontFamily: 'monospace',
              bgcolor: 'background.level1',
              px: 0.75,
              py: 0.25,
              borderRadius: '4px',
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            —
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
            Collega elemento
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}