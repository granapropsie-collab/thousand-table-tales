import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BiddingPanelProps {
  currentBid: number;
  isMyTurn: boolean;
  onBid: (amount: number) => void;
  onPass: () => void;
}

export const BiddingPanel = ({ currentBid, isMyTurn, onBid, onPass }: BiddingPanelProps) => {
  if (!isMyTurn) {
    return (
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-6 py-3 rounded-lg border border-border animate-fade-in">
        <span className="text-muted-foreground">Aktualna licytacja: </span>
        <span className="text-2xl font-display text-gold">{currentBid}</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-md px-6 py-4 rounded-xl border border-gold/30 shadow-xl animate-scale-in">
      <div className="text-center mb-4">
        <span className="text-muted-foreground text-sm">Twoja tura - licytuj lub pasuj</span>
        <div className="text-3xl font-display text-gold">{currentBid}</div>
      </div>
      
      <div className="flex gap-2 mb-3">
        {[10, 20, 30, 50].map((increment) => (
          <Button
            key={increment}
            variant="outline"
            size="sm"
            onClick={() => onBid(currentBid + increment)}
            className="flex-1"
          >
            +{increment}
          </Button>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Button 
          variant="destructive" 
          className="flex-1" 
          onClick={onPass}
        >
          Pas
        </Button>
        <Button 
          variant="gold" 
          className="flex-1" 
          onClick={() => onBid(currentBid + 10)}
        >
          Licytuję {currentBid + 10}
        </Button>
      </div>
    </div>
  );
};
