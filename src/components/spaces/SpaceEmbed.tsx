import { useState, useRef, useEffect } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import Typography from '@mui/joy@5.0.0-beta.48/Typography';
import Sheet from '@mui/joy@5.0.0-beta.48/Sheet';
import Checkbox from '@mui/joy@5.0.0-beta.48/Checkbox';
import List from '@mui/joy@5.0.0-beta.48/List';
import ListItem from '@mui/joy@5.0.0-beta.48/ListItem';
import ListItemButton from '@mui/joy@5.0.0-beta.48/ListItemButton';
import ListItemDecorator from '@mui/joy@5.0.0-beta.48/ListItemDecorator';
import { 
  ExternalLink,
  ChevronDown,
  FileText,
  LayoutDashboard,
  Database,
  Palette,
  Minimize2,
  Maximize2,
  Check
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Space } from '../../types';
import { RichTextRenderer } from './RichTextRenderer';
import { useSettings } from '../../hooks/useSettings';

interface SpaceEmbedProps {
  space: Space;
  onNavigate: (spaceId: string) => void;
  compact?: boolean;
  spacesState?: any;
}

export function SpaceEmbed({ space, onNavigate, compact = false, spacesState }: SpaceEmbedProps) {
  const [previewHeight, setPreviewHeight] = useState<'reduced' | 'full'>('reduced');
  const [menuOpen, setMenuOpen] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { settings } = useSettings();

  // Chiudi il menu quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        badgeRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !badgeRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'page':
        return FileText;
      case 'canvas':
        return Palette;
      case 'database':
        return Database;
      case 'dashboard':
        return LayoutDashboard;
      default:
        return FileText;
    }
  };

  const TypeIcon = getTypeIcon(space.type);
  const SpaceIcon = space.icon && (LucideIcons as any)[space.icon] 
    ? (LucideIcons as any)[space.icon] 
    : TypeIcon;

  // Preview content based on type
  const renderPreview = () => {
    if (space.type === 'page' && space.content?.blocks) {
      // Mostra TUTTI i blocchi, incluso il titolo incorporato
      const blocks = space.content.blocks;
      return (
        <Box>
          {/* Titolo incorporato */}
          <Typography
            level="h1"
            sx={{
              fontSize: '2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {space.title}
          </Typography>
          
          {/* Blocchi */}
          {blocks.map((block: any, index: number) => {
            // Heading 1
            if (block.type === 'heading1') {
              return (
                <Typography
                  key={index}
                  level="h2"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {block.content || '(vuoto)'}
                </Typography>
              );
            }

            // Heading 2
            if (block.type === 'heading2') {
              return (
                <Typography
                  key={index}
                  level="h3"
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 0.75,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {block.content || '(vuoto)'}
                </Typography>
              );
            }

            // Heading 3
            if (block.type === 'heading3') {
              return (
                <Typography
                  key={index}
                  level="h4"
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {block.content || '(vuoto)'}
                </Typography>
              );
            }

            // Bullet List
            if (block.type === 'bulletList') {
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    mb: 0.25,
                    overflow: 'hidden',
                  }}
                >
                  <Typography sx={{ flexShrink: 0 }}>•</Typography>
                  <Typography
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.content || '(vuoto)'}
                  </Typography>
                </Box>
              );
            }

            // Numbered List
            if (block.type === 'numberedList') {
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    mb: 0.25,
                    overflow: 'hidden',
                  }}
                >
                  <Typography sx={{ flexShrink: 0 }}>{index + 1}.</Typography>
                  <Typography
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.content || '(vuoto)'}
                  </Typography>
                </Box>
              );
            }

            // Checkbox
            if (block.type === 'checkbox') {
              return (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    alignItems: 'center',
                    mb: 0.25,
                    overflow: 'hidden',
                  }}
                >
                  <Checkbox
                    checked={block.checked || false}
                    size="sm"
                    sx={{ pointerEvents: 'none' }}
                  />
                  <Typography
                    sx={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textDecoration: block.checked ? 'line-through' : 'none',
                      opacity: block.checked ? 0.6 : 1,
                    }}
                  >
                    {block.content || '(vuoto)'}
                  </Typography>
                </Box>
              );
            }

            // Quote
            if (block.type === 'quote') {
              return (
                <Box
                  key={index}
                  sx={{
                    borderLeft: '3px solid',
                    borderColor: 'neutral.outlinedBorder',
                    pl: 1.5,
                    mb: 0.5,
                    overflow: 'hidden',
                  }}
                >
                  <Typography
                    sx={{
                      fontStyle: 'italic',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.content || '(vuoto)'}
                  </Typography>
                </Box>
              );
            }

            // Divider
            if (block.type === 'divider') {
              return (
                <Box
                  key={index}
                  sx={{
                    height: '1px',
                    bgcolor: 'divider',
                    my: 1,
                  }}
                />
              );
            }

            // Text (default)
            return (
              <Box
                key={index}
                sx={{
                  mb: 0.25,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {block.content.includes('[[') ? (
                  <RichTextRenderer
                    content={block.content}
                    onSpaceLinkClick={onNavigate}
                    spacesState={spacesState}
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  />
                ) : (
                  <Typography
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {block.content || '(vuoto)'}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      );
    }

    if (space.type === 'canvas') {
      const elements = space.content?.elements || [];
      if (elements.length === 0) {
        return (
          <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
            <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
              Canvas vuoto
            </Typography>
          </Box>
        );
      }

      // Calcola bounding box di tutti gli elementi in modo più preciso
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      elements.forEach((el: any) => {
        if (el.type === 'text') {
          // Stima più accurata per il testo
          const textWidth = (el.text || '').length * 10; // circa 10px per carattere
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y - 16); // fontSize di 16
          maxX = Math.max(maxX, el.x + textWidth);
          maxY = Math.max(maxY, el.y + 4);
        } else if (el.type === 'circle') {
          minX = Math.min(minX, el.x - el.radius);
          minY = Math.min(minY, el.y - el.radius);
          maxX = Math.max(maxX, el.x + el.radius);
          maxY = Math.max(maxY, el.y + el.radius);
        } else if (el.type === 'path') {
          if (el.points) {
            el.points.split(' ').forEach((p: string) => {
              const coords = p.split(',');
              if (coords.length === 2) {
                const x = Number(coords[0]);
                const y = Number(coords[1]);
                if (!isNaN(x) && !isNaN(y)) {
                  minX = Math.min(minX, x);
                  minY = Math.min(minY, y);
                  maxX = Math.max(maxX, x);
                  maxY = Math.max(maxY, y);
                }
              }
            });
          }
        } else if (el.type === 'arrow' || el.type === 'line') {
          const x1 = el.x;
          const y1 = el.y;
          const x2 = el.x + (el.width || 0);
          const y2 = el.y + (el.height || 0);
          minX = Math.min(minX, x1, x2);
          minY = Math.min(minY, y1, y2);
          maxX = Math.max(maxX, x1, x2);
          maxY = Math.max(maxY, y1, y2);
        } else if (el.type === 'rectangle' || el.type === 'spaceEmbed') {
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + (el.width || 0));
          maxY = Math.max(maxY, el.y + (el.height || 0));
        } else {
          // Fallback generico
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + (el.width || 100));
          maxY = Math.max(maxY, el.y + (el.height || 100));
        }
      });

      // Margine ridotto
      const padding = 10;
      const viewBoxWidth = maxX - minX + padding * 2;
      const viewBoxHeight = maxY - minY + padding * 2;
      const aspectRatio = viewBoxWidth / viewBoxHeight;

      return (
        <Box sx={{ borderRadius: '4px', overflow: 'hidden', bgcolor: 'background.level1' }}>
          <svg
            viewBox={`${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}`}
            style={{
              width: '100%',
              height: aspectRatio > 2 ? '100px' : '150px',
              display: 'block'
            }}
          >
            {elements.map((el: any, index: number) => {
              if (el.type === 'path') {
                return (
                  <polyline
                    key={index}
                    points={el.points}
                    fill="none"
                    stroke={el.color || '#000'}
                    strokeWidth={el.strokeWidth || 2}
                  />
                );
              }
              if (el.type === 'rectangle') {
                return (
                  <rect
                    key={index}
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="none"
                    stroke={el.color || '#000'}
                    strokeWidth={el.strokeWidth || 2}
                  />
                );
              }
              if (el.type === 'circle') {
                return (
                  <circle
                    key={index}
                    cx={el.x}
                    cy={el.y}
                    r={el.radius}
                    fill="none"
                    stroke={el.color || '#000'}
                    strokeWidth={el.strokeWidth || 2}
                  />
                );
              }
              if (el.type === 'text') {
                return (
                  <text
                    key={index}
                    x={el.x}
                    y={el.y}
                    fill={el.color || '#000'}
                    fontSize="16"
                    fontFamily="sans-serif"
                  >
                    {el.text}
                  </text>
                );
              }
              if (el.type === 'arrow' || el.type === 'line') {
                const x1 = el.x;
                const y1 = el.y;
                const x2 = el.x + (el.width || 0);
                const y2 = el.y + (el.height || 0);
                return (
                  <g key={index}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={el.color || '#000'}
                      strokeWidth={el.strokeWidth || 2}
                    />
                    {el.type === 'arrow' && (() => {
                      const angle = Math.atan2(y2 - y1, x2 - x1);
                      const arrowSize = 10;
                      return (
                        <polygon
                          points={`${x2},${y2} ${x2 - arrowSize * Math.cos(angle - Math.PI / 6)},${y2 - arrowSize * Math.sin(angle - Math.PI / 6)} ${x2 - arrowSize * Math.cos(angle + Math.PI / 6)},${y2 - arrowSize * Math.sin(angle + Math.PI / 6)}`}
                          fill={el.color || '#000'}
                        />
                      );
                    })()}
                  </g>
                );
              }
              if (el.type === 'spaceEmbed') {
                return (
                  <rect
                    key={index}
                    x={el.x}
                    y={el.y}
                    width={el.width || 200}
                    height={el.height || 150}
                    fill="#f0f0f0"
                    stroke="#999"
                    strokeWidth={1}
                    rx={4}
                  />
                );
              }
              return null;
            })}
          </svg>
        </Box>
      );
    }

    return (
      <Box sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
        <Typography level="body-sm" sx={{ fontStyle: 'italic' }}>
          {space.type} space
        </Typography>
      </Box>
    );
  };

  if (compact) {
    return (
      <Sheet
        variant="outlined"
        sx={{
          p: 1.5,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': {
            bgcolor: 'background.level1',
            borderColor: 'primary.300',
          },
        }}
        onClick={() => onNavigate(space.id)}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '6px',
            bgcolor: space.iconColor || 'primary.softBg',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <SpaceIcon size={16} style={{ color: space.iconColor || 'inherit' }} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography level="body-sm" sx={{ fontWeight: 600 }}>
            {space.title}
          </Typography>
          <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
            {space.type}
          </Typography>
        </Box>
        <ExternalLink size={14} />
      </Sheet>
    );
  }

  return (
    <>
      <Sheet
        variant="outlined"
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate(space.id);
        }}
        sx={{
          p: 2,
          borderRadius: settings.previewBorderRadius,
          border: '1px solid',
          borderColor: 'neutral.300',
          bgcolor: 'background.surface',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.2s',
          cursor: 'default',
          '&:hover': {
            borderColor: 'primary.500',
            boxShadow: 'sm',
          }
        }}
      >
        {/* Badge Preview con dropdown - sempre visibile */}
        <Box
          ref={badgeRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          sx={{
            position: 'absolute',
            top: -12,
            right: 40,
            zIndex: 10,
            bgcolor: 'primary.solidBg',
            color: '#ffffff',
            borderRadius: '4px',
            px: 0.75,
            py: 0.25,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            cursor: 'pointer',
            boxShadow: 'md',
            '&:hover': {
              bgcolor: 'primary.solidHoverBg',
            }
          }}
        >
          <Typography level="body-xs" sx={{ fontWeight: 600, color: '#ffffff', fontSize: '0.7rem', fontStyle: 'italic' }}>
            Preview
          </Typography>
          <ChevronDown size={10} />
        </Box>

        {/* Anteprima con altezza condizionale */}
        <Box 
          sx={{ 
            width: '100%',
            maxHeight: previewHeight === 'reduced' ? '300px' : 'none',
            overflow: previewHeight === 'reduced' ? 'auto' : 'visible'
          }}
        >
          {renderPreview()}
        </Box>
      </Sheet>

      {/* Dropdown menu custom per impostazioni altezza */}
      {menuOpen && (
        <Box
          ref={menuRef}
          sx={{
            position: 'fixed',
            top: badgeRef.current ? badgeRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: badgeRef.current ? badgeRef.current.getBoundingClientRect().left : 0,
            zIndex: 1200,
            bgcolor: 'background.surface',
            borderRadius: '8px',
            boxShadow: 'lg',
            border: '1px solid',
            borderColor: 'neutral.outlinedBorder',
            minWidth: '200px',
            overflow: 'hidden',
          }}
        >
          <List size="sm" sx={{ p: 0 }}>
            <ListItem sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  setPreviewHeight('reduced');
                  setMenuOpen(false);
                }}
                selected={previewHeight === 'reduced'}
                sx={{
                  py: 1,
                  px: 1.5,
                  gap: 1,
                }}
              >
                <ListItemDecorator>
                  <Minimize2 size={16} />
                </ListItemDecorator>
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm">Altezza ridotta (300px)</Typography>
                </Box>
                {previewHeight === 'reduced' && <Check size={16} />}
              </ListItemButton>
            </ListItem>
            <ListItem sx={{ p: 0 }}>
              <ListItemButton
                onClick={() => {
                  setPreviewHeight('full');
                  setMenuOpen(false);
                }}
                selected={previewHeight === 'full'}
                sx={{
                  py: 1,
                  px: 1.5,
                  gap: 1,
                }}
              >
                <ListItemDecorator>
                  <Maximize2 size={16} />
                </ListItemDecorator>
                <Box sx={{ flex: 1 }}>
                  <Typography level="body-sm">Altezza completa</Typography>
                </Box>
                {previewHeight === 'full' && <Check size={16} />}
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      )}
    </>
  );
}