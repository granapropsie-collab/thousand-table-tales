import { Card, Suit } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card?: Card;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  className?: string;
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const sizeClasses = {
  sm: 'w-12 h-16 text-xs',
  md: 'w-16 h-22 text-sm',
  lg: 'w-20 h-28 text-base',
};

export const PlayingCard = ({
  card,
  size = 'md',
  faceDown = false,
  onClick,
  isPlayable = false,
  isSelected = false,
  className,
}: PlayingCardProps) => {
  if (faceDown || !card) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg bg-gradient-to-br from-wood-medium via-wood-dark to-wood-medium',
          'border-2 border-gold/30 card-shadow',
          'flex items-center justify-center',
          'relative overflow-hidden',
          className
        )}
      >
        {/* Card back pattern */}
        <div className="absolute inset-2 rounded border border-gold/20 bg-gradient-to-br from-gold/10 to-transparent" />
        <div className="absolute inset-3 rounded border border-gold/10" />
        <span className="text-gold/40 font-display text-2xl">♠</span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        sizeClasses[size],
        'rounded-lg bg-gradient-to-br from-cream to-cream-dark',
        'border-2 card-shadow',
        'flex flex-col items-center justify-between p-1.5',
        'transition-all duration-200',
        isPlayable && 'cursor-pointer hover:-translate-y-2 hover:shadow-xl',
        isSelected && 'ring-2 ring-gold -translate-y-3',
        !isPlayable && !isSelected && 'border-cream-dark/50',
        isPlayable && 'border-gold/50 glow-gold',
        className
      )}
    >
      <div className={cn('font-bold self-start', suitColors[card.suit])}>
        <div className="leading-none">{card.rank}</div>
        <div className="text-lg leading-none">{suitSymbols[card.suit]}</div>
      </div>
      
      <div className={cn('text-3xl', suitColors[card.suit])}>
        {suitSymbols[card.suit]}
      </div>
      
      <div className={cn('font-bold self-end rotate-180', suitColors[card.suit])}>
        <div className="leading-none">{card.rank}</div>
        <div className="text-lg leading-none">{suitSymbols[card.suit]}</div>
      </div>
    </div>
  );
};
