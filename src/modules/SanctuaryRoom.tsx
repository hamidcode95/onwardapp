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
  { id: 'mug', name: 'Brain Fuel Mug', cost: 15, emoji: '☕', description: 'A steaming mug near Oly' },
  { id: 'plant', name: 'Minimalist Plant', cost: 30, emoji: '🌿', description: 'Line-art sage plant' },
  { id: 'rug', name: 'Cozy Rug', cost: 50, emoji: '🟤', description: 'A soft rug for the room' },
  { id: 'lamp', name: 'Focus Lamp', cost: 100, emoji: '💡', description: 'Toggle room brightness' },
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

/* ───────── SVG ROOM ITEMS ───────── */

function HorizonWindow({ timeOfDay }: { timeOfDay: string }) {
  const sky = {
    day: ['hsl(200, 70%, 80%)', 'hsl(200, 55%, 90%)'],
    sunset: ['hsl(25, 80%, 55%)', 'hsl(45, 70%, 75%)'],
    night: ['hsl(230, 40%, 12%)', 'hsl(240, 30%, 22%)'],
  }[timeOfDay] ?? ['hsl(200,70%,80%)', 'hsl(200,55%,90%)'];

  return (
    <div
      className="absolute z-[1]"
      style={{ top: '15%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: '45%' }}
    >
      <svg width="100%" height="100%" viewBox="0 0 200 180" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sky-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={sky[0]} />
            <stop offset="100%" stopColor={sky[1]} />
          </linearGradient>
          <clipPath id="arch">
            <path d="M10 180 V70 Q10 10 100 10 Q190 10 190 70 V180 Z" />
          </clipPath>
        </defs>
        {/* arch fill */}
        <path d="M10 180 V70 Q10 10 100 10 Q190 10 190 70 V180 Z" fill="url(#sky-g)" clipPath="url(#arch)" />
        {/* frame */}
        <path d="M10 180 V70 Q10 10 100 10 Q190 10 190 70 V180" fill="none" stroke="hsl(30,25%,30%)" strokeWidth="6" />
        {/* cross bar */}
        <line x1="100" y1="10" x2="100" y2="180" stroke="hsl(30,25%,30%)" strokeWidth="4" />
        <line x1="10" y1="100" x2="190" y2="100" stroke="hsl(30,25%,30%)" strokeWidth="4" />

        {timeOfDay === 'night' && (
          <>
            <motion.circle cx="55" cy="45" r="1.5" fill="white" animate={{ opacity: [.3,1,.3] }} transition={{ duration: 2, repeat: Infinity }} />
            <motion.circle cx="140" cy="35" r="1" fill="white" animate={{ opacity: [.4,.9,.4] }} transition={{ duration: 2.5, repeat: Infinity, delay: .4 }} />
            <motion.circle cx="80" cy="70" r="1.2" fill="white" animate={{ opacity: [.5,1,.5] }} transition={{ duration: 1.8, repeat: Infinity, delay: .8 }} />
            <motion.circle cx="160" cy="60" r="1" fill="white" animate={{ opacity: [.3,.8,.3] }} transition={{ duration: 2.2, repeat: Infinity, delay: 1.2 }} />
          </>
        )}
        {timeOfDay === 'day' && <circle cx="150" cy="45" r="14" fill="hsl(45,90%,72%)" opacity={.9} />}
        {timeOfDay === 'sunset' && <circle cx="100" cy="140" r="18" fill="hsl(15,85%,58%)" opacity={.7} />}
      </svg>
    </div>
  );
}

function SagePlant() {
  return (
    <motion.div
      className="absolute z-[5] cursor-pointer"
      style={{ bottom: '10%', left: '15%' }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: .3 }}
    >
      <svg width="60" height="90" viewBox="0 0 60 90" fill="none">
        {/* pot */}
        <path d="M15 55 L20 85 H40 L45 55 Z" stroke="hsl(30,30%,45%)" strokeWidth="2" fill="none" />
        <line x1="15" y1="55" x2="45" y2="55" stroke="hsl(30,30%,45%)" strokeWidth="2.5" />
        {/* leaves */}
        <motion.g animate={{ rotate: [-2, 2, -2] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <ellipse cx="30" cy="38" rx="6" ry="14" fill="none" stroke="hsl(150,45%,55%)" strokeWidth="1.8" />
          <ellipse cx="22" cy="42" rx="5" ry="12" fill="none" stroke="hsl(150,50%,50%)" strokeWidth="1.8" transform="rotate(-20 22 42)" />
          <ellipse cx="38" cy="42" rx="5" ry="12" fill="none" stroke="hsl(150,40%,58%)" strokeWidth="1.8" transform="rotate(20 38 42)" />
          <ellipse cx="30" cy="48" rx="4" ry="10" fill="none" stroke="hsl(150,45%,52%)" strokeWidth="1.8" transform="rotate(8 30 48)" />
        </motion.g>
        {/* stem */}
        <line x1="30" y1="55" x2="30" y2="35" stroke="hsl(150,35%,45%)" strokeWidth="1.5" />
      </svg>
    </motion.div>
  );
}

function FocusLamp({ isNight, onToggle }: { isNight: boolean; onToggle: () => void }) {
  return (
    <motion.div
      className="absolute z-[5] cursor-pointer"
      style={{ top: '45%', right: '10%' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: .95 }}
      onClick={onToggle}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: .4 }}
    >
      <svg width="70" height="110" viewBox="0 0 70 110" fill="none">
        {/* base */}
        <ellipse cx="35" cy="105" rx="18" ry="5" fill="hsl(40,20%,35%)" />
        {/* pole */}
        <line x1="35" y1="105" x2="35" y2="55" stroke="hsl(40,20%,40%)" strokeWidth="3" />
        {/* angled arm */}
        <line x1="35" y1="55" x2="55" y2="25" stroke="hsl(40,20%,40%)" strokeWidth="3" strokeLinecap="round" />
        {/* shade */}
        <path d="M40 28 L55 8 L70 28 Z" fill="hsl(45,60%,55%)" stroke="hsl(40,30%,40%)" strokeWidth="1.5" />
        {/* glow */}
        {isNight && (
          <motion.ellipse
            cx="55" cy="35" rx="30" ry="22"
            fill="hsla(45,80%,65%,.12)"
            animate={{ opacity: [.08, .2, .08], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            style={{ filter: 'blur(6px)' }}
          />
        )}
      </svg>
    </motion.div>
  );
}

function BrainFuelMug() {
  return (
    <motion.div
      className="absolute z-[11] cursor-pointer"
      style={{ top: '62%', left: '58%' }}
      whileHover={{ scale: 1.05 }}
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: .2 }}
    >
      <svg width="40" height="45" viewBox="0 0 40 45" fill="none">
        {/* body */}
        <rect x="6" y="14" width="20" height="24" rx="3" fill="hsl(20,50%,38%)" />
        {/* handle */}
        <path d="M26 18 Q34 18 34 26 Q34 34 26 34" stroke="hsl(20,50%,38%)" strokeWidth="3" fill="none" />
        {/* steam */}
        <motion.g animate={{ y: [0, -5, 0], opacity: [.3, .7, .3] }} transition={{ duration: 2.5, repeat: Infinity }}>
          <path d="M12 12 Q14 5 16 12" stroke="hsla(0,0%,100%,.35)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M17 10 Q19 3 21 10" stroke="hsla(0,0%,100%,.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M22 12 Q24 6 26 12" stroke="hsla(0,0%,100%,.25)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </motion.g>
      </svg>
    </motion.div>
  );
}

function CozyRug() {
  return (
    <motion.div
      className="absolute z-[2]"
      style={{ bottom: '5%', left: '50%', transform: 'translateX(-50%)', width: '60%', height: '15%' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: .15 }}
    >
      <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
        <ellipse cx="150" cy="40" rx="145" ry="35"
          fill="hsla(150,25%,25%,.4)"
          stroke="hsl(150,30%,35%)"
          strokeWidth="2"
          strokeDasharray="8 4"
        />
        <ellipse cx="150" cy="40" rx="110" ry="22"
          fill="none"
          stroke="hsl(150,25%,40%)"
          strokeWidth="1"
          strokeDasharray="5 5"
          opacity={.5}
        />
      </svg>
    </motion.div>
  );
}

function Whiteboard({ onClick, isNight }: { onClick: () => void; isNight: boolean }) {
  return (
    <motion.div
      className="absolute z-[5] cursor-pointer"
      style={{ top: '20%', left: '5%' }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: .95 }}
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', delay: .5 }}
    >
      <svg width="75" height="60" viewBox="0 0 80 65" fill="none">
        <rect x="4" y="4" width="72" height="50" rx="3" fill="hsl(0,0%,94%)" stroke="hsl(30,28%,38%)" strokeWidth="3" />
        <line x1="14" y1="18" x2="54" y2="18" stroke="hsl(220,45%,60%)" strokeWidth="1.3" strokeDasharray="3 2" />
        <line x1="14" y1="27" x2="48" y2="27" stroke="hsl(220,45%,60%)" strokeWidth="1.3" strokeDasharray="3 2" />
        <line x1="14" y1="36" x2="42" y2="36" stroke="hsl(220,45%,60%)" strokeWidth="1.3" strokeDasharray="3 2" />
        <text x="58" y="42" fontSize="13">🪶</text>
        <circle cx="40" cy="4" r="3.5" fill="hsl(0,65%,52%)" />
        {isNight && (
          <motion.rect x="0" y="0" width="80" height="65" rx="3"
            fill="hsla(45,80%,65%,.04)"
            animate={{ opacity: [.02, .07, .02] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        )}
      </svg>
      <p className="text-[9px] text-muted-foreground text-center mt-0.5 font-medium">How to Earn</p>
    </motion.div>
  );
}

/* ───────── MAIN COMPONENT ───────── */

export function SanctuaryRoom({ onBack, feathers, purchasedItems, onPurchase }: SanctuaryRoomProps) {
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [lampOn, setLampOn] = useState(false);
  const timeOfDay = useTimeOfDay();
  const isNight = timeOfDay === 'night';
  const roomDarkened = isNight && !lampOn;

  const wallColor = useMemo(() => {
    if (lampOn && isNight) return 'hsl(150, 18%, 16%)';
    return { day: 'hsl(150, 20%, 18%)', sunset: 'hsl(150, 18%, 15%)', night: 'hsl(150, 12%, 9%)' }[timeOfDay];
  }, [timeOfDay, lampOn, isNight]);

  const floorColor = useMemo(() => {
    if (lampOn && isNight) return 'hsl(30, 22%, 16%)';
    return { day: 'hsl(30, 25%, 22%)', sunset: 'hsl(30, 22%, 18%)', night: 'hsl(30, 15%, 10%)' }[timeOfDay];
  }, [timeOfDay, lampOn, isNight]);

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: .4 }}
    >
      {/* Room */}
      <div className="relative w-full h-full flex flex-col">
        {/* Wall */}
        <div className="relative flex-1 transition-colors duration-700" style={{ backgroundColor: wallColor }}>

          {/* Night overlay — excludes window & lamp via mix-blend */}
          {roomDarkened && (
            <motion.div
              className="absolute inset-0 pointer-events-none z-[15]"
              style={{ backgroundColor: 'hsla(230, 35%, 8%, .4)', mixBlendMode: 'multiply' }}
              animate={{ opacity: [.35, .45, .35] }}
              transition={{ duration: 5, repeat: Infinity }}
            />
          )}

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-[30] flex items-center justify-between p-3 sm:p-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="text-foreground gap-2 glass-card">
              <ArrowLeft size={18} /> Exit
            </Button>
            <div className="glass-card px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-semibold text-foreground">
              🪶 {feathers}
            </div>
          </div>

          {/* Static elements */}
          <HorizonWindow timeOfDay={timeOfDay} />
          <Whiteboard onClick={() => setShowWhiteboard(true)} isNight={isNight} />

          {/* Oly — center */}
          <div className="absolute z-[10]" style={{ top: '55%', left: '50%', transform: 'translate(-50%, -50%)' }}>
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
              <Oly state="neutral" size={140} />
            </motion.div>
          </div>

          {/* Purchased items */}
          {purchasedItems.includes('plant') && <SagePlant />}
          {purchasedItems.includes('lamp') && <FocusLamp isNight={isNight} onToggle={() => setLampOn(p => !p)} />}
          {purchasedItems.includes('mug') && <BrainFuelMug />}
          {purchasedItems.includes('rug') && <CozyRug />}
        </div>

        {/* Floor */}
        <div className="h-[18%] transition-colors duration-700 relative" style={{ backgroundColor: floorColor }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: 'hsla(0,0%,100%,.05)' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Button onClick={() => setShowShop(true)} className="neon-glow text-base px-6 py-3" size="lg">
              🛒 Open Shop
            </Button>
          </div>
        </div>
      </div>

      {/* ─── Whiteboard Modal ─── */}
      <AnimatePresence>
        {showWhiteboard && (
          <motion.div className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowWhiteboard(false)} />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl p-6 z-10"
              style={{ backgroundColor: 'hsl(0,0%,96%)', border: '4px solid hsl(30,30%,40%)', fontFamily: '"Comic Sans MS","Marker Felt",cursive' }}
              initial={{ scale: .5, opacity: 0, rotate: -5 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: .5, opacity: 0, rotate: 5 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              <button onClick={() => setShowWhiteboard(false)} className="absolute top-3 right-3 text-gray-500 hover:text-gray-800">
                <X size={20} />
              </button>
              <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">🪶 How to Earn Feathers</h3>
              <div className="space-y-3">
                {EARN_GUIDE.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-gray-700 text-sm">
                    <span>{item.icon} {item.activity}</span>
                    <span className="font-bold text-green-700">{item.reward}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 text-center mt-4">Keep going — every feather counts!</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Shop Overlay ─── */}
      <AnimatePresence>
        {showShop && (
          <motion.div className="fixed inset-0 z-[60] flex items-end justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowShop(false)} />
            <motion.div
              className="relative w-full max-w-md glass-card rounded-t-2xl p-5 pb-8 z-10"
              style={{ backgroundColor: 'hsl(150,18%,14%)' }}
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
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
                          <span className="text-xs text-primary font-semibold px-3 py-1 rounded-full border border-primary/30">✓ Owned</span>
                        ) : (
                          <Button size="sm" disabled={!canAfford} className={canAfford ? 'neon-glow' : ''} onClick={() => onPurchase(item.id, item.cost)}>
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
