import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Oly } from '@/components/Oly';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'mug', name: 'Coffee Mug', cost: 30, emoji: '☕', description: 'A warm mug near Oly' },
  { id: 'plant', name: 'Green Plant', cost: 50, emoji: '🌿', description: 'Life in the corner' },
  { id: 'lamp', name: 'Desk Lamp', cost: 100, emoji: '💡', description: 'Warm glow at night' },
];

const EARN_GUIDE = [
  { activity: 'Complete a sub-task', reward: '+10 🪶', icon: '✂️' },
  { activity: 'Finish a focus session', reward: '+50 🪶', icon: '⏱️' },
  { activity: 'Daily check-in (coming soon)', reward: '+5 🪶', icon: '📅' },
  { activity: 'Brain dump entry (coming soon)', reward: '+3 🪶', icon: '🧠' },
];

interface SanctuaryRoomProps {
  onBack: () => void;
  feathers: number;
  purchasedItems: string[];
  onPurchase: (itemId: string, cost: number) => boolean;
}

function useTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'sunset';
  return 'night';
}

// Room SVG items
function RoomPlant() {
  return (
    <motion.div
      className="absolute bottom-[12%] left-[8%]"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.3 }}
    >
      <svg width="70" height="90" viewBox="0 0 70 90">
        <ellipse cx="35" cy="82" rx="18" ry="8" fill="hsl(30, 40%, 30%)" />
        <rect x="22" y="50" width="26" height="35" rx="5" fill="hsl(25, 45%, 35%)" />
        <circle cx="35" cy="35" r="20" fill="hsl(140, 50%, 35%)" />
        <circle cx="25" cy="25" r="14" fill="hsl(145, 55%, 40%)" />
        <circle cx="45" cy="28" r="12" fill="hsl(135, 45%, 38%)" />
        <circle cx="35" cy="18" r="10" fill="hsl(150, 60%, 43%)" />
      </svg>
    </motion.div>
  );
}

function RoomLamp({ isNight }: { isNight: boolean }) {
  return (
    <motion.div
      className="absolute bottom-[15%] right-[10%]"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.4 }}
    >
      <svg width="60" height="100" viewBox="0 0 60 100">
        <rect x="26" y="35" width="8" height="55" rx="3" fill="hsl(40, 20%, 45%)" />
        <ellipse cx="30" cy="92" rx="16" ry="5" fill="hsl(40, 20%, 40%)" />
        <motion.path
          d="M10 38 Q30 -5 50 38 Z"
          fill={isNight ? 'hsl(45, 85%, 65%)' : 'hsl(45, 60%, 55%)'}
          animate={isNight ? { opacity: [0.8, 1, 0.8] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        {isNight && (
          <motion.ellipse
            cx="30" cy="20" rx="35" ry="25"
            fill="hsla(45, 80%, 65%, 0.1)"
            animate={{ opacity: [0.15, 0.35, 0.15], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </svg>
    </motion.div>
  );
}

function RoomMug() {
  return (
    <motion.div
      className="absolute bottom-[18%] left-[42%]"
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.2 }}
    >
      <svg width="45" height="45" viewBox="0 0 45 45">
        <rect x="8" y="12" width="22" height="26" rx="4" fill="hsl(20, 55%, 40%)" />
        <path d="M30 16 Q38 16 38 26 Q38 34 30 34" stroke="hsl(20, 55%, 40%)" strokeWidth="3.5" fill="none" />
        <motion.path
          d="M14 10 Q16 3 18 10 M20 7 Q22 0 24 7"
          stroke="hsla(0, 0%, 100%, 0.35)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          animate={{ y: [0, -4, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </svg>
    </motion.div>
  );
}

function Whiteboard({ onClick, isNight }: { onClick: () => void; isNight: boolean }) {
  return (
    <motion.div
      className="absolute top-[18%] left-[5%] cursor-pointer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      <svg width="80" height="65" viewBox="0 0 80 65">
        {/* Board frame */}
        <rect x="4" y="4" width="72" height="50" rx="4" fill="hsl(0, 0%, 95%)" stroke="hsl(30, 30%, 40%)" strokeWidth="3" />
        {/* Lines on the board */}
        <line x1="14" y1="18" x2="56" y2="18" stroke="hsl(220, 50%, 60%)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="14" y1="28" x2="50" y2="28" stroke="hsl(220, 50%, 60%)" strokeWidth="1.5" strokeDasharray="3 2" />
        <line x1="14" y1="38" x2="45" y2="38" stroke="hsl(220, 50%, 60%)" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Feather icon on board */}
        <text x="60" y="42" fontSize="14">🪶</text>
        {/* Pin */}
        <circle cx="40" cy="4" r="4" fill="hsl(0, 70%, 55%)" />
        {isNight && (
          <motion.rect
            x="0" y="0" width="80" height="65" rx="4"
            fill="hsla(45, 80%, 65%, 0.05)"
            animate={{ opacity: [0.03, 0.08, 0.03] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </svg>
      <p className="text-[10px] text-muted-foreground text-center mt-1 font-medium">How to Earn</p>
    </motion.div>
  );
}

function RoomWindow({ timeOfDay }: { timeOfDay: 'day' | 'sunset' | 'night' }) {
  const skyColors = {
    day: ['hsl(200, 70%, 75%)', 'hsl(200, 60%, 85%)'],
    sunset: ['hsl(25, 80%, 60%)', 'hsl(40, 70%, 70%)'],
    night: ['hsl(230, 40%, 15%)', 'hsl(240, 35%, 25%)'],
  };
  const colors = skyColors[timeOfDay];

  return (
    <div className="absolute top-[8%] right-[8%]">
      <svg width="90" height="80" viewBox="0 0 90 80">
        <defs>
          <linearGradient id="sky-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        {/* Window frame */}
        <rect x="5" y="5" width="80" height="65" rx="4" fill="url(#sky-grad)" stroke="hsl(30, 25%, 35%)" strokeWidth="4" />
        {/* Cross frame */}
        <line x1="45" y1="5" x2="45" y2="70" stroke="hsl(30, 25%, 35%)" strokeWidth="3" />
        <line x1="5" y1="37" x2="85" y2="37" stroke="hsl(30, 25%, 35%)" strokeWidth="3" />
        {/* Stars at night */}
        {timeOfDay === 'night' && (
          <>
            <motion.circle cx="25" cy="20" r="1.5" fill="white"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0 }}
            />
            <motion.circle cx="65" cy="15" r="1" fill="white"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            />
            <motion.circle cx="55" cy="50" r="1.2" fill="white"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: 1 }}
            />
          </>
        )}
        {/* Sun for day / sunset */}
        {timeOfDay === 'day' && (
          <circle cx="70" cy="20" r="8" fill="hsl(45, 90%, 70%)" />
        )}
        {timeOfDay === 'sunset' && (
          <circle cx="45" cy="60" r="10" fill="hsl(15, 85%, 60%)" opacity={0.8} />
        )}
      </svg>
    </div>
  );
}

export function SanctuaryRoom({ onBack, feathers, purchasedItems, onPurchase }: SanctuaryRoomProps) {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const timeOfDay = useTimeOfDay();
  const isNight = timeOfDay === 'night';

  const wallColor = useMemo(() => {
    switch (timeOfDay) {
      case 'day': return 'hsl(150, 20%, 18%)';
      case 'sunset': return 'hsl(150, 18%, 15%)';
      case 'night': return 'hsl(150, 15%, 10%)';
    }
  }, [timeOfDay]);

  const floorColor = useMemo(() => {
    switch (timeOfDay) {
      case 'day': return 'hsl(30, 25%, 22%)';
      case 'sunset': return 'hsl(30, 22%, 18%)';
      case 'night': return 'hsl(30, 18%, 12%)';
    }
  }, [timeOfDay]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Room container */}
      <div className="relative w-full h-full flex flex-col">
        {/* Back wall */}
        <div
          className="relative flex-1 transition-colors duration-1000"
          style={{ backgroundColor: wallColor }}
        >
          {/* Night overlay */}
          {isNight && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundColor: 'hsla(230, 30%, 5%, 0.35)' }}
              animate={{ opacity: [0.3, 0.4, 0.3] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-foreground gap-2 glass-card"
            >
              <ArrowLeft size={18} />
              Exit to Dashboard
            </Button>
            <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold text-foreground">
              🪶 {feathers}
            </div>
          </div>

          {/* Window */}
          <RoomWindow timeOfDay={timeOfDay} />

          {/* Whiteboard */}
          <Whiteboard onClick={() => setShowWhiteboard(true)} isNight={isNight} />

          {/* Central Oly */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Oly state="neutral" size={130} />
            </motion.div>
          </div>

          {/* Purchased items */}
          {purchasedItems.includes('plant') && <RoomPlant />}
          {purchasedItems.includes('lamp') && <RoomLamp isNight={isNight} />}
          {purchasedItems.includes('mug') && <RoomMug />}
        </div>

        {/* Floor */}
        <div
          className="h-[22%] transition-colors duration-1000 relative"
          style={{ backgroundColor: floorColor }}
        >
          {/* Floor line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: 'hsla(0, 0%, 100%, 0.06)' }} />

          {/* Shop button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              onClick={() => setShowShop(true)}
              className="neon-glow text-base px-6 py-3"
              size="lg"
            >
              🛒 Open Shop
            </Button>
          </div>
        </div>
      </div>

      {/* Whiteboard modal */}
      <AnimatePresence>
        {showWhiteboard && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowWhiteboard(false)} />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl p-6 z-10"
              style={{
                backgroundColor: 'hsl(0, 0%, 96%)',
                border: '4px solid hsl(30, 30%, 40%)',
                fontFamily: '"Comic Sans MS", "Marker Felt", cursive',
              }}
              initial={{ scale: 0.5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.5, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <button
                onClick={() => setShowWhiteboard(false)}
                className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
              >
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">
                🪶 How to Earn Feathers
              </h3>
              <div className="space-y-3">
                {EARN_GUIDE.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-gray-700 text-sm">
                    <span>{item.icon} {item.activity}</span>
                    <span className="font-bold text-green-700">{item.reward}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">
                Keep going — every feather counts!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shop overlay */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowShop(false)} />
            <motion.div
              className="relative w-full max-w-md glass-card rounded-t-2xl p-5 pb-8 z-10"
              style={{ backgroundColor: 'hsl(150, 18%, 14%)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-foreground neon-text">🏡 Sanctuary Shop</h3>
                <p className="text-xs text-muted-foreground mt-1">Decorate Oly's room</p>
                <span className="text-base font-bold text-primary mt-1 inline-block">🪶 {feathers}</span>
              </div>
              <div className="space-y-3">
                {SHOP_ITEMS.map(item => {
                  const owned = purchasedItems.includes(item.id);
                  const canAfford = feathers >= item.cost;
                  return (
                    <GlassCard key={item.id} hover={false}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{item.emoji}</span>
                          <div>
                            <h4 className="font-semibold text-foreground text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        {owned ? (
                          <span className="text-xs text-primary font-semibold px-3 py-1 rounded-full border border-primary/30">
                            ✓ Owned
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford}
                            className={canAfford ? 'neon-glow' : ''}
                            onClick={() => onPurchase(item.id, item.cost)}
                          >
                            🪶 {item.cost}
                          </Button>
                        )}
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
