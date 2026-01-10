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
import { useState, useRef, useEffect } from 'react';
import { Button } from '@heroui/react';
import { Checkbox } from '../ui/checkbox';

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
        <div>
          {/* Titolo incorporato */}
          <h1 className="text-3xl font-bold text-center mb-4 overflow-hidden text-ellipsis whitespace-nowrap">
            {space.title}
          </h1>
          
          {/* Blocchi */}
          {blocks.map((block: any, index: number) => {
            // Heading 1
            if (block.type === 'heading1') {
              return (
                <h2
                  key={index}
                  className="text-2xl font-bold mb-2 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {block.content || '(vuoto)'}
                </h2>
              );
            }

            // Heading 2
            if (block.type === 'heading2') {
              return (
                <h3
                  key={index}
                  className="text-xl font-bold mb-1.5 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {block.content || '(vuoto)'}
                </h3>
              );
            }

            // Heading 3
            if (block.type === 'heading3') {
              return (
                <h4
                  key={index}
                  className="text-lg font-bold mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {block.content || '(vuoto)'}
                </h4>
              );
            }

            // Heading 4
            if (block.type === 'heading4') {
              return (
                <h5
                  key={index}
                  className="text-base font-bold mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  {block.content || '(vuoto)'}
                </h5>
              );
            }

            // Bullet List
            if (block.type === 'bulletList') {
              return (
                <div
                  key={index}
                  className="flex gap-2 mb-1 overflow-hidden"
                >
                  <span className="shrink-0">•</span>
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {block.content || '(vuoto)'}
                  </span>
                </div>
              );
            }

            // Numbered List
            if (block.type === 'numberedList') {
              let listNumber = 1;
              for (let i = index - 1; i >= 0; i--) {
                if (blocks[i].type === 'numberedList') {
                  listNumber++;
                } else {
                  break;
                }
              }

              return (
                <div
                  key={index}
                  className="flex gap-2 mb-1 overflow-hidden"
                >
                  <span className="shrink-0">{listNumber}.</span>
                  <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {block.content || '(vuoto)'}
                  </span>
                </div>
              );
            }

            // Checkbox
            if (block.type === 'checkbox') {
              return (
                <div
                  key={index}
                  className="flex gap-2 items-center mb-1 overflow-hidden"
                >
                  <Checkbox
                    checked={block.checked || false}
                    className="pointer-events-none"
                  />
                  <span
                    className={`flex-1 overflow-hidden text-ellipsis whitespace-nowrap ${block.checked ? 'line-through opacity-60' : ''}`}
                  >
                    {block.content || '(vuoto)'}
                  </span>
                </div>
              );
            }

            // Quote
            if (block.type === 'quote') {
              return (
                <div
                  key={index}
                  className="border-l-4 border-divider pl-4 mb-2 overflow-hidden"
                >
                  <span className="italic overflow-hidden text-ellipsis whitespace-nowrap block">
                    {block.content || '(vuoto)'}
                  </span>
                </div>
              );
            }

            // Divider
            if (block.type === 'divider') {
              return (
                <div
                  key={index}
                  className="h-[1px] bg-divider my-4"
                />
              );
            }

            // Text (default)
            return (
              <div
                key={index}
                className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap"
              >
                {block.content.includes('[[') ? (
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    <RichTextRenderer
                      content={block.content}
                    />
                  </div>
                ) : (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap block">
                    {block.content || '(vuoto)'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    if (space.type === 'canvas') {
      const elements = space.content?.elements || [];
      if (elements.length === 0) {
        return (
          <div className="text-default-500 text-center py-8 italic text-small">
            Canvas vuoto
          </div>
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
          
          // Determinazione del percorso (d) per supporto frecce elettriche/curvate
          let pathData = `M ${x1},${y1} L ${x2},${y2}`;
          
          if (el.arrowType === 'curved') {
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const normX = dx / dist;
            const normY = dy / dist;
            const perpX = -normY;
            const perpY = normX;
            const offset = (el.curvature || 0) * (dist / 2);
            const cpX = midX + perpX * offset;
            const cpY = midY + perpY * offset;
            pathData = `M ${x1},${y1} Q ${cpX},${cpY} ${x2},${y2}`;
          } else if (el.arrowType === 'electrical' && el.waypoints && el.waypoints.length > 0) {
            pathData = `M ${x1},${y1}`;
            el.waypoints.forEach((p: any) => {
              pathData += ` L ${p.x},${p.y}`;
            });
            pathData += ` L ${x2},${y2}`;
          }

          minX = Math.min(minX, x1, x2);
          minY = Math.min(minY, y1, y2);
          maxX = Math.max(maxX, x1, x2);
          maxY = Math.max(maxY, y1, y2);
        } else if (el.type === 'rectangle' || el.type === 'spaceEmbed' || el.type === 'blockEmbed' || el.type === 'image' || el.type === 'file') {
          const rw = el.width || 100;
          const rh = el.height || 100;
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
          maxX = Math.max(maxX, el.x + rw);
          maxY = Math.max(maxY, el.y + rh);
        } else if (el.type === 'group') {
          // Simplification for group: we would need recursive bounds, but let's at least check its own x,y
          minX = Math.min(minX, el.x);
          minY = Math.min(minY, el.y);
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
        <div className="rounded-md overflow-hidden bg-default-100">
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
                
                // Determinazione del percorso (d) per supporto frecce elettriche/curvate
                let pathData = `M ${x1},${y1} L ${x2},${y2}`;
                
                if (el.arrowType === 'curved') {
                  const midX = (x1 + x2) / 2;
                  const midY = (y1 + y2) / 2;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const dist = Math.sqrt(dx * dx + dy * dy);
                  const normX = dx / dist;
                  const normY = dy / dist;
                  const perpX = -normY;
                  const perpY = normX;
                  const offset = (el.curvature || 0) * (dist / 2);
                  const cpX = midX + perpX * offset;
                  const cpY = midY + perpY * offset;
                  pathData = `M ${x1},${y1} Q ${cpX},${cpY} ${x2},${y2}`;
                } else if (el.arrowType === 'electrical' && el.waypoints && el.waypoints.length > 0) {
                  pathData = `M ${x1},${y1}`;
                  el.waypoints.forEach((p: any) => {
                    pathData += ` L ${p.x},${p.y}`;
                  });
                  pathData += ` L ${x2},${y2}`;
                }

                return (
                  <g key={index}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={el.color || '#000'}
                      strokeWidth={el.strokeWidth || 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {el.type === 'arrow' && (() => {
                      // Calcolo angolo finale per la punta della freccia
                      let angle = 0;
                      let lastX = x1, lastY = y1;
                      
                      if (el.arrowType === 'electrical' && el.waypoints && el.waypoints.length > 0) {
                        const lastPoint = el.waypoints[el.waypoints.length - 1];
                        lastX = lastPoint.x;
                        lastY = lastPoint.y;
                      } else if (el.arrowType === 'curved') {
                        const midX = (x1 + x2) / 2;
                        const midY = (y1 + y2) / 2;
                        const dx = x2 - x1;
                        const dy = y2 - y1;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const perpX = -(dy / dist);
                        const perpY = (dx / dist);
                        const offset = (el.curvature || 0) * (dist / 2);
                        const cpX = midX + perpX * offset;
                        const cpY = midY + perpY * offset;
                        lastX = cpX;
                        lastY = cpY;
                      }
                      
                      angle = Math.atan2(y2 - lastY, x2 - lastX);
                      const arrowSize = 8;
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
              if (el.type === 'spaceEmbed' || el.type === 'blockEmbed') {
                return (
                  <g key={index}>
                    <rect
                      x={el.x}
                      y={el.y}
                      width={el.width || 200}
                      height={el.height || 150}
                      fill="#f8f9fa"
                      stroke="#dee2e6"
                      strokeWidth={1}
                      rx={4}
                    />
                    <text
                      x={el.x + 10}
                      y={el.y + 20}
                      fontSize="10"
                      fill="#999"
                      fontFamily="sans-serif"
                    >
                      {el.type === 'spaceEmbed' ? '📄 Pagina' : '🔗 Blocco'}
                    </text>
                  </g>
                );
              }
              if (el.type === 'image') {
                return (
                  <g key={index}>
                    <rect
                      x={el.x}
                      y={el.y}
                      width={el.width || 100}
                      height={el.height || 100}
                      fill="#e9ecef"
                      stroke="#ced4da"
                      strokeWidth={1}
                      rx={4}
                    />
                    {el.imageUrl ? (
                      <image
                        href={el.imageUrl}
                        x={el.x + 2}
                        y={el.y + 2}
                        width={(el.width || 100) - 4}
                        height={(el.height || 100) - 4}
                        preserveAspectRatio="xMidYMid slice"
                      />
                    ) : (
                      <text
                        x={el.x + (el.width || 100) / 2}
                        y={el.y + (el.height || 100) / 2}
                        fontSize="10"
                        fill="#999"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontFamily="sans-serif"
                      >
                        🖼️ Immagine
                      </text>
                    )}
                  </g>
                );
              }
              if (el.type === 'file') {
                return (
                  <g key={index}>
                    <rect
                      x={el.x}
                      y={el.y}
                      width={el.width || 120}
                      height={el.height || 40}
                      fill="#fff"
                      stroke="#ced4da"
                      strokeWidth={1}
                      rx={4}
                    />
                    <text
                      x={el.x + 8}
                      y={el.y + 24}
                      fontSize="10"
                      fill="#6c757d"
                      fontFamily="sans-serif"
                    >
                      📄 {el.fileName || 'File'}
                    </text>
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>
      );
    }

    return (
      <div className="text-default-500 text-center py-8 italic text-small">
        {space.type} space
      </div>
    );
  };

  if (compact) {
    return (
      <div
        className="p-3 rounded-lg flex items-center gap-2 cursor-pointer transition-colors border border-divider hover:bg-default-100 hover:border-primary-300"
        onClick={() => onNavigate(space.id)}
      >
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: space.iconColor || 'var(--heroui-primary-100)' }}
        >
          <SpaceIcon size={16} style={{ color: space.iconColor || 'inherit' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-small font-semibold">
            {space.title}
          </p>
          <p className="text-tiny text-default-400">
            {space.type}
          </p>
        </div>
        <ExternalLink size={14} />
      </div>
    );
  }

  return (
    <>
      <div
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onNavigate(space.id);
        }}
        className="p-4 bg-background relative overflow-visible transition-all cursor-default hover:shadow-sm"
        style={{
          borderRadius: '32px',
          border: '2px solid #D4AF37',
          pointerEvents: 'auto'
        }}
      >
        {/* Badge Preview con dropdown - sempre visibile */}
        <div
          ref={badgeRef}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="absolute -top-3 right-10 z-10 bg-primary text-white rounded px-2 py-0.5 flex items-center gap-1 cursor-pointer shadow-md hover:bg-primary-600 transition-colors"
        >
          <span className="text-[0.7rem] font-semibold italic">
            Preview
          </span>
          <ChevronDown size={10} />
        </div>

        {/* Anteprima con altezza condizionale */}
        <div 
          className="w-full"
          style={{ 
            maxHeight: previewHeight === 'reduced' ? '300px' : 'none',
            overflow: previewHeight === 'reduced' ? 'auto' : 'visible'
          }}
        >
          {renderPreview()}
        </div>
      </div>

      {/* Dropdown menu custom per impostazioni altezza */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="fixed z-[1200] bg-white rounded-lg shadow-lg border border-divider min-w-[200px] overflow-hidden"
          style={{
            top: badgeRef.current ? badgeRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: badgeRef.current ? badgeRef.current.getBoundingClientRect().left : 0,
          }}
        >
          <div className="flex flex-col p-1">
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${previewHeight === 'reduced' ? 'bg-default-100' : 'hover:bg-default-50'}`}
              onClick={() => {
                setPreviewHeight('reduced');
                setMenuOpen(false);
              }}
            >
              <Minimize2 size={16} />
              <div className="flex-1">
                <span className="text-small">Altezza ridotta (300px)</span>
              </div>
              {previewHeight === 'reduced' && <Check size={16} />}
            </div>
            <div
              className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${previewHeight === 'full' ? 'bg-default-100' : 'hover:bg-default-50'}`}
              onClick={() => {
                setPreviewHeight('full');
                setMenuOpen(false);
              }}
            >
              <Maximize2 size={16} />
              <div className="flex-1">
                <span className="text-small">Altezza completa</span>
              </div>
              {previewHeight === 'full' && <Check size={16} />}
            </div>
          </div>
        </div>
      )}
    </>
  );
}