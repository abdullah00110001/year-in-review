import { cn } from '@/lib/utils';
import type { BlurStyle } from './types';

interface BlurStyleSelectorProps {
  selectedStyle: BlurStyle;
  onStyleChange: (s: BlurStyle) => void;
}

const STYLES: { value: BlurStyle; icon: string; label: string; description: string; preview: string }[] = [
  {
    value: 'PIXELATE',
    icon: '▦',
    label: 'Pixelate',
    description: 'Blocky pixels',
    preview: 'bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-primary/40 via-violet-500/40 to-pink-500/40',
  },
  {
    value: 'FROSTED',
    icon: '❄️',
    label: 'Frosted',
    description: 'Glass blur',
    preview: 'bg-gradient-to-br from-primary/40 via-cyan-500/30 to-violet-500/40 backdrop-blur',
  },
  {
    value: 'SOLID',
    icon: '■',
    label: 'Solid',
    description: 'Solid color',
    preview: 'bg-foreground/80',
  },
  {
    value: 'MOSAIC',
    icon: '◈',
    label: 'Mosaic',
    description: 'Tile mosaic',
    preview: 'bg-foreground/40 [background-image:radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.7)_2px,transparent_3px),radial-gradient(circle_at_70%_60%,hsl(var(--primary)/0.6)_2px,transparent_3px)] [background-size:10px_10px]',
  },
];

export function BlurStyleSelector({ selectedStyle, onStyleChange }: BlurStyleSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5" role="radiogroup" aria-label="Blur style">
      {STYLES.map((s) => {
        const selected = selectedStyle === s.value;
        return (
          <button
            key={s.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onStyleChange(s.value)}
            className={cn(
              'rounded-2xl p-3 border text-center transition-all duration-200 active:scale-[0.97]',
              selected
                ? 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-[0_0_24px_-12px] shadow-primary/40'
                : 'border-border/50 bg-card hover:border-border',
            )}
          >
            <div className={cn('h-12 w-full rounded-lg mb-2 flex items-center justify-center text-xl', s.preview)}>
              <span aria-hidden>{s.icon}</span>
            </div>
            <div className="text-xs font-medium">{s.label}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{s.description}</div>
          </button>
        );
      })}
    </div>
  );
}

export default BlurStyleSelector;
