import { cn } from '@/lib/utils';

interface TrumpSelectorProps {
  onSelect: (trump: string) => void;
}

const trumps = [
  { suit: 'hearts', symbol: '♥', name: 'Kier', points: 100, color: 'text-red-500' },
  { suit: 'diamonds', symbol: '♦', name: 'Karo', points: 80, color: 'text-red-500' },
  { suit: 'clubs', symbol: '♣', name: 'Trefl', points: 60, color: 'text-cream' },
  { suit: 'spades', symbol: '♠', name: 'Pik', points: 40, color: 'text-cream' },
];

export const TrumpSelector = ({ onSelect }: TrumpSelectorProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-gold/30 rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in shadow-2xl">
        <h2 className="text-2xl font-display gold-text text-center mb-2">Wybierz Atut</h2>
        <p className="text-muted-foreground text-center text-sm mb-6">
          Wygrałeś licytację! Wybierz kolor atutowy.
        </p>
        
        <div className="grid grid-cols-2 gap-4">
          {trumps.map((trump) => (
            <button
              key={trump.suit}
              onClick={() => onSelect(trump.suit)}
              className={cn(
                'flex flex-col items-center justify-center p-6 rounded-xl',
                'bg-secondary/50 border-2 border-border',
                'hover:border-gold hover:bg-secondary transition-all duration-200',
                'hover:scale-105 hover:shadow-lg'
              )}
            >
              <span className={cn('text-5xl mb-2', trump.color)}>
                {trump.symbol}
              </span>
              <span className="text-cream font-display">{trump.name}</span>
              <span className="text-muted-foreground text-xs">
                Meldunek: {trump.points} pkt
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
