import { Link2, Copy, MoveRight } from 'lucide-react';

interface DragTooltipProps {
  mode: 'link' | 'duplicate' | 'move';
}

export function DragTooltip({ mode }: DragTooltipProps) {
  const modeConfig = {
    link: {
      icon: Link2,
      title: 'Link',
      description: 'Create a link in the other space',
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
    },
    duplicate: {
      icon: Copy,
      title: 'Duplicate',
      description: 'Create an independent copy',
      color: 'text-success-500',
      bgColor: 'bg-success-50',
    },
    move: {
      icon: MoveRight,
      title: 'Move',
      description: 'Remove from original',
      color: 'text-warning-500',
      bgColor: 'bg-warning-50',
    },
  };

  const config = modeConfig[mode];
  const Icon = config.icon;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white border border-divider rounded-xl px-4 py-3 shadow-lg z-[10000] flex flex-col gap-2 min-w-[320px]"
    >
      {/* Current mode */}
      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center shrink-0`}
        >
          <Icon size={18} className={config.color} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {config.title}
          </p>
          <p className="text-xs text-default-500">
            {config.description}
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-divider" />

      {/* Shortcuts */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <code className="bg-default-100 px-1.5 py-0.5 rounded text-xs min-w-[40px] text-center font-mono">
            Alt
          </code>
          <span className="text-xs text-default-500">
            Duplicate element
          </span>
        </div>

        <div className="flex items-center gap-3">
          <code className="bg-default-100 px-1.5 py-0.5 rounded text-xs min-w-[40px] text-center font-mono">
            Shift
          </code>
          <span className="text-xs text-default-500">
            Move element
          </span>
        </div>

        <div className="flex items-center gap-3">
          <code className="bg-default-100 px-1.5 py-0.5 rounded text-xs min-w-[40px] text-center font-mono">
            —
          </code>
          <span className="text-xs text-default-500">
            Link element
          </span>
        </div>
      </div>
    </div>
  );
}
