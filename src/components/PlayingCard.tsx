import { Card } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';
import cardBackImage from '@/assets/card-back.png';

interface PlayingCardProps {
  card?: Card;
  size?: 'sm' | 'md' | 'lg';
  faceDown?: boolean;
  onClick?: () => void;
  isPlayable?: boolean;
  isSelected?: boolean;
  isAnimating?: boolean;
  animationDelay?: number;
  className?: string;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-600',
  diamonds: 'text-red-600',
  clubs: 'text-gray-900',
  spades: 'text-gray-900',
};

const sizeClasses = {
  sm: 'w-12 h-[72px] text-xs',
  md: 'w-16 h-24 text-sm',
  lg: 'w-20 h-[120px] text-base',
};

export const PlayingCard = ({
  card,
  size = 'md',
  faceDown = false,
  onClick,
  isPlayable = false,
  isSelected = false,
  isAnimating = false,
  animationDelay = 0,
  className,
}: PlayingCardProps) => {
  const isHidden = faceDown || !card || card.hidden;

  if (isHidden) {
    return (
      <div
        className={cn(
          sizeClasses[size],
          'rounded-lg overflow-hidden card-shadow',
          'relative transition-all duration-300',
          isAnimating && 'animate-[deal_0.5s_ease-out_forwards]',
          className
        )}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <img 
          src={cardBackImage} 
          alt="Card back" 
          className="w-full h-full object-cover"
        />
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
        isPlayable && 'cursor-pointer hover:-translate-y-3 hover:shadow-xl hover:z-10 border-gold/50 glow-gold',
        isSelected && 'ring-2 ring-gold -translate-y-4 shadow-xl z-10',
        !isPlayable && !isSelected && 'border-cream-dark/30',
        isAnimating && 'animate-[deal_0.5s_ease-out_forwards]',
        className
      )}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className={cn('font-bold self-start leading-none', suitColors[card.suit])}>
        <div>{card.rank}</div>
        <div className="text-lg">{suitSymbols[card.suit]}</div>
      </div>
      
      <div className={cn('text-3xl', suitColors[card.suit])}>
        {suitSymbols[card.suit]}
      </div>
      
      <div className={cn('font-bold self-end rotate-180 leading-none', suitColors[card.suit])}>
        <div>{card.rank}</div>
        <div className="text-lg">{suitSymbols[card.suit]}</div>
      </div>
    </div>
  );
};
