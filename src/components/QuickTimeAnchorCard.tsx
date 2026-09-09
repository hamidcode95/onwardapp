import { useState } from 'react';
import { AlarmClock, Plus, Settings2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ScrollPicker } from '@/components/ScrollPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface QuickTimeAnchorCardProps {
  onAdd: (label: string, targetTime: string) => void;
  onManage: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function QuickTimeAnchorCard({ onAdd, onManage }: QuickTimeAnchorCardProps) {
  const [label, setLabel] = useState('');
  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    onAdd(trimmed, target.toISOString());
    setLabel('');
  };

  return (
    <GlassCard hover={false} className="col-span-2 animate-pulse-glow border border-primary/50">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-primary">
          <AlarmClock size={20} />
          <h3 className="font-semibold text-foreground">Time Anchor</h3>
        </div>
        <button
          onClick={onManage}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings2 size={14} />
          Manage
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What's the task?"
          className="flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />
        <div className="flex shrink-0 items-center gap-1">
          <ScrollPicker values={HOURS} value={hour} onChange={setHour} />
          <span className="text-sm font-bold text-muted-foreground">:</span>
          <ScrollPicker values={MINUTES} value={minute} onChange={setMinute} />
        </div>
        <Button size="icon" onClick={handleAdd} disabled={!label.trim()} className="shrink-0 neon-glow">
          <Plus size={18} />
        </Button>
      </div>
    </GlassCard>
  );
}
