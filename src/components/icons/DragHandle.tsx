import { Box } from '@mui/joy@5.0.0-beta.48';

interface DragHandleProps {
  height?: number | string;
  isHovered?: boolean;
}

export function DragHandle({ height = '100%', isHovered = false }: DragHandleProps) {
  // Calcola l'altezza effettiva riducendo 10px totali (5px sopra + 5px sotto)
  const effectiveHeight = typeof height === 'number' ? `${height - 10}px` : 'calc(100% - 10px)';
  
  return (
    <Box
      sx={{
        position: 'relative',
        width: 16,
        height: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Linea centrale verticale ispessita con punte semicircolari */}
      <Box
        sx={{
          width: '3px',
          height: effectiveHeight,
          bgcolor: isHovered ? 'primary.500' : 'text.tertiary',
          transition: 'background-color 0.2s',
          borderRadius: '999px', // Bordo completamente arrotondato per semicerchi alle punte
        }}
      />
    </Box>
  );
}