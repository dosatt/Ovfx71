import { useRef, useState, useEffect } from 'react';
import Box from '@mui/joy@5.0.0-beta.48/Box';
import IconButton from '@mui/joy@5.0.0-beta.48/IconButton';
import { Pencil, Eraser, Trash2 } from 'lucide-react';

export function DrawApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2;
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : '#000000';
    ctx.lineWidth = tool === 'eraser' ? 10 : 2;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 1 }}>
        <IconButton
          size="sm"
          variant={tool === 'pen' ? 'solid' : 'plain'}
          onClick={() => setTool('pen')}
        >
          <Pencil size={16} />
        </IconButton>
        <IconButton
          size="sm"
          variant={tool === 'eraser' ? 'solid' : 'plain'}
          onClick={() => setTool('eraser')}
        >
          <Eraser size={16} />
        </IconButton>
        <IconButton size="sm" variant="plain" onClick={clearCanvas}>
          <Trash2 size={16} />
        </IconButton>
      </Box>

      {/* Canvas */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: tool === 'pen' ? 'crosshair' : 'pointer',
            width: '100%',
            height: '100%',
            backgroundColor: '#ffffff'
          }}
        />
      </Box>
    </Box>
  );
}