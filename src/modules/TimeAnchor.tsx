import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Plus, BellRing, Bell, Check, Loader2 } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { ScrollPicker } from '@/components/ScrollPicker';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TimeAnchor as TimeAnchorType } from '@/hooks/useAppState';
import { notifications } from '@/lib/notifications';

interface TimeAnchorModuleProps {
  onBack: () => void;
  anchors: TimeAnchorType[];
  onAdd: (label: string, targetTime: string) => void;
  onRemove: (id: string) => void;
  userId?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimeAnchor({ onBack, anchors, onAdd, onRemove, userId }: TimeAnchorModuleProps) {
  const [label, setLabel] = useState('');
  const now = new Date();
  const [hour, setHour] = useState(now.getHours());
  const [minute, setMinute] = useState(now.getMinutes());
  const [pushStatus, setPushStatus] = useState<'idle' | 'loading' | 'enabled' | 'unsupported' | 'denied'>(
    'idle'
  );

  const upcomingAnchors = useMemo(
    () =>
      anchors
        .filter(a => !a.dismissed)
        .sort((a, b) => new Date(a.targetTime).getTime() - new Date(b.targetTime).getTime()),
    [anchors]
  );

  const handleAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;

    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    // If the picked time already passed today, schedule it for tomorrow
    if (target.getTime() <= Date.now()) {
      target.setDate(target.getDate() + 1);
    }

    onAdd(trimmed, target.toISOString());
    setLabel('');
  };

  const handleEnableBackgroundAlerts = async () => {
    if (!userId) return;
    if (!notifications.isSupported()) {
      setPushStatus('unsupported');
      return;
    }
    setPushStatus('loading');
    const result = await notifications.enableBackgroundAlerts(userId);
    if (result.ok) {
      setPushStatus('enabled');
    } else if ('reason' in result && result.reason === 'denied') {
      setPushStatus('denied');
    } else {
      setPushStatus('unsupported');
    }
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Time Anchor"
        description="Set a quick nudge for anything time-sensitive"
        onBack={onBack}
      />

      <GlassCard className="mb-4" hover={false}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 shrink-0 text-primary">
            {pushStatus === 'enabled' ? <Check size={20} /> : <BellRing size={20} />}
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground">Background alerts</p>
            <p className="mb-2 text-sm text-muted-foreground">
              {pushStatus === 'enabled'
                ? 'Anchors will notify you even if the app is fully closed.'
                : pushStatus === 'denied'
                ? 'Notifications are blocked in your browser settings.'
                : pushStatus === 'unsupported'
                ? 'Not supported here yet — on iPhone, add Onward to your Home Screen first.'
                : 'Enable to get nudged even when the app is closed.'}
            </p>
            {pushStatus !== 'enabled' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEnableBackgroundAlerts}
                disabled={pushStatus === 'loading'}
              >
                {pushStatus === 'loading' ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Bell size={16} className="mr-2" />
                )}
                Enable background alerts
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      <GlassCard className="mb-6" hover={false}>
        <label className="mb-2 block text-sm text-muted-foreground">What do you need to do?</label>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Take medication, Join meeting"
          className="mb-4"
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
        />

        <label className="mb-2 block text-sm text-muted-foreground">When?</label>
        <div className="mb-4 flex items-center justify-center gap-2">
          <ScrollPicker values={HOURS} value={hour} onChange={setHour} />
          <span className="text-xl font-bold text-muted-foreground">:</span>
          <ScrollPicker values={MINUTES} value={minute} onChange={setMinute} />
        </div>

        <Button className="w-full neon-glow" onClick={handleAdd} disabled={!label.trim()}>
          <Plus size={18} className="mr-2" />
          Set Time Anchor
        </Button>
      </GlassCard>

      {upcomingAnchors.length > 0 && (
        <div className="space-y-2">
          <p className="mb-2 text-sm text-muted-foreground">Active anchors</p>
          {upcomingAnchors.map((anchor, index) => (
            <motion.div
              key={anchor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
            >
              <GlassCard hover={false} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{anchor.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(anchor.targetTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {anchor.fired ? ' · ringing' : ''}
                  </p>
                </div>
                <button
                  onClick={() => onRemove(anchor.id)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
                  aria-label="Remove anchor"
                >
                  <X size={18} />
                </button>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
