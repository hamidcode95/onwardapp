import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Volume2, Palette, Maximize } from 'lucide-react';
import { GlassCard } from '@/components/GlassCard';
import { ModuleHeader } from '@/components/ModuleHeader';
import { Oly } from '@/components/Oly';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';

interface SettingsProps {
  onBack: () => void;
  userName: string;
  olySize: number;
  onUpdateName: (name: string) => void;
  onUpdateOlySize: (size: number) => void;
}

const AMBIENT_SOUNDS = [
  { id: 'none', name: 'Off', emoji: '🔇' },
  { id: 'rain', name: 'Rain', emoji: '🌧️' },
  { id: 'forest', name: 'Forest', emoji: '🌲' },
  { id: 'cafe', name: 'Café', emoji: '☕' },
  { id: 'waves', name: 'Waves', emoji: '🌊' },
];

export function Settings({ 
  onBack, 
  userName, 
  olySize, 
  onUpdateName, 
  onUpdateOlySize 
}: SettingsProps) {
  const [localName, setLocalName] = useState(userName);
  const [localOlySize, setLocalOlySize] = useState([olySize]);
  const [selectedSound, setSelectedSound] = useState('none');

  const handleNameSave = () => {
    onUpdateName(localName);
  };

  const handleOlySizeChange = (value: number[]) => {
    setLocalOlySize(value);
    onUpdateOlySize(value[0]);
  };

  return (
    <div className="min-h-screen p-4">
      <ModuleHeader
        title="Settings"
        description="Customize your experience"
        onBack={onBack}
      />

      <div className="flex justify-center mb-6">
        <Oly state="neutral" size={localOlySize[0]} />
      </div>

      {/* Profile Settings */}
      <GlassCard className="mb-4" hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <User size={20} className="text-primary" />
          </div>
          <h3 className="font-semibold">Profile</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Your name"
            className="bg-background/50 border-border"
          />
          <Button onClick={handleNameSave} variant="outline">
            Save
          </Button>
        </div>
      </GlassCard>

      {/* Oly Size */}
      <GlassCard className="mb-4" hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Maximize size={20} className="text-primary" />
          </div>
          <h3 className="font-semibold">Oly Size</h3>
        </div>
        <div className="px-2">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Small</span>
            <span>{localOlySize[0]}px</span>
            <span>Large</span>
          </div>
          <Slider
            value={localOlySize}
            onValueChange={handleOlySizeChange}
            min={60}
            max={160}
            step={10}
            className="w-full"
          />
        </div>
      </GlassCard>

      {/* Ambient Sounds */}
      <GlassCard className="mb-4" hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Volume2 size={20} className="text-primary" />
          </div>
          <h3 className="font-semibold">Ambient Sounds</h3>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {AMBIENT_SOUNDS.map((sound) => (
            <motion.button
              key={sound.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedSound(sound.id)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedSound === sound.id 
                  ? 'bg-primary/30 border border-primary' 
                  : 'bg-background/50 border border-border'
              }`}
            >
              <span className="text-xl">{sound.emoji}</span>
              <p className="text-xs text-muted-foreground mt-1">{sound.name}</p>
            </motion.button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center">
          🔊 Sound playback coming soon
        </p>
      </GlassCard>

      {/* Theme Customization */}
      <GlassCard hover={false}>
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/20">
            <Palette size={20} className="text-primary" />
          </div>
          <h3 className="font-semibold">Theme</h3>
        </div>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#95D5B2] border-2 border-primary neon-glow" />
          <div className="w-8 h-8 rounded-full bg-[#7C3AED] border-2 border-border opacity-50" />
          <div className="w-8 h-8 rounded-full bg-[#F59E0B] border-2 border-border opacity-50" />
          <div className="w-8 h-8 rounded-full bg-[#EC4899] border-2 border-border opacity-50" />
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          🎨 More themes coming soon
        </p>
      </GlassCard>
    </div>
  );
}
