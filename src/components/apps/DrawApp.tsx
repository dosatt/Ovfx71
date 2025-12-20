import { useRef, useState, useEffect } from 'react';
import { Button } from '@heroui/react';
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
    <div className="flex flex-col h-full bg-white">
      {/* Toolbar */}
      <div className="p-2 border-b border-divider flex gap-2">
        <Button
          isIconOnly
          size="sm"
          variant={tool === 'pen' ? 'solid' : 'light'}
          color={tool === 'pen' ? 'primary' : 'default'}
          onPress={() => setTool('pen')}
        >
          <Pencil size={16} />
        </Button>
        <Button
          isIconOnly
          size="sm"
          variant={tool === 'eraser' ? 'solid' : 'light'}
          color={tool === 'eraser' ? 'primary' : 'default'}
          onPress={() => setTool('eraser')}
        >
          <Eraser size={16} />
        </Button>
        <Button isIconOnly size="sm" variant="light" color="danger" onPress={clearCanvas}>
          <Trash2 size={16} />
        </Button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={1920}
          height={1080}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          className={`w-full h-full ${tool === 'pen' ? 'cursor-crosshair' : 'cursor-pointer'}`}
          style={{
            backgroundColor: '#ffffff'
          }}
        />
      </div>
    </div>
  );
}
