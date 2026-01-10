interface DragHandleProps {
  height?: number | string;
  isHovered?: boolean;
}

export function DragHandle({ height = '100%', isHovered = false }: DragHandleProps) {
  // Calcola l'altezza effettiva riducendo 10px totali (5px sopra + 5px sotto)
  const effectiveHeight = typeof height === 'number' ? `${height - 10}px` : 'calc(100% - 10px)';
  
  return (
    <div
      className="relative w-4 flex items-center justify-center"
      style={{ height: height }}
    >
      {/* Linea centrale verticale ispessita con punte semicircolari */}
      <div
        className={`
          w-[3px] rounded-full transition-colors duration-200
          ${isHovered ? 'bg-primary' : 'bg-[#e5e5e5]'}
        `}
        style={{ height: effectiveHeight }}
      />
    </div>
  );
}