import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/GlassCard';
import { Lock, Check } from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 'mug', name: 'Coffee Mug', cost: 30, emoji: '☕', description: 'A warm mug to keep Oly company' },
  { id: 'plant', name: 'Green Plant', cost: 50, emoji: '🌿', description: 'A little life beside your buddy' },
  { id: 'lamp', name: 'Desk Lamp', cost: 100, emoji: '💡', description: 'Warm light for cozy focus sessions' },
];

interface SanctuaryShopProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feathers: number;
  purchasedItems: string[];
  onPurchase: (itemId: string, cost: number) => boolean;
}

export function SanctuaryShop({ open, onOpenChange, feathers, purchasedItems, onPurchase }: SanctuaryShopProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center text-primary neon-text">🏡 Sanctuary Shop</DrawerTitle>
          <DrawerDescription className="text-center">
            Decorate Oly's home with your earned feathers
          </DrawerDescription>
          <div className="text-center mt-1">
            <span className="text-lg font-bold text-primary">🪶 {feathers}</span>
          </div>
        </DrawerHeader>
        <div className="p-4 space-y-3 pb-8">
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
                    <Button size="sm" variant="outline" disabled className="gap-1">
                      <Check size={14} /> Owned
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      disabled={!canAfford}
                      className={canAfford ? 'neon-glow' : ''}
                      onClick={() => onPurchase(item.id, item.cost)}
                    >
                      {canAfford ? (
                        <>🪶 {item.cost}</>
                      ) : (
                        <><Lock size={14} className="mr-1" /> {item.cost}</>
                      )}
                    </Button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
