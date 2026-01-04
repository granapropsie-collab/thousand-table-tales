import { cn } from '@/lib/utils';

interface PlayerAvatarProps {
  nickname: string;
  hatType?: 'cowboy' | 'bowler' | 'sombrero' | 'tophat';
  team?: 'A' | 'B' | null;
  isCurrentTurn?: boolean;
  isPartner?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const hatEmojis: Record<string, string> = {
  cowboy: '🤠',
  bowler: '🎩',
  sombrero: '👒',
  tophat: '🎓',
};

export const PlayerAvatar = ({
  nickname,
  hatType = 'cowboy',
  team,
  isCurrentTurn = false,
  isPartner = false,
  size = 'md',
  className,
}: PlayerAvatarProps) => {
  const sizeClasses = {
    sm: 'w-12 h-12 text-xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-20 h-20 text-3xl',
  };

  const nameSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      <div
        className={cn(
          sizeClasses[size],
          'rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-wood-medium to-wood-dark',
          'border-3 transition-all duration-300',
          team === 'A' && 'border-team-a',
          team === 'B' && 'border-team-b',
          !team && 'border-gold/30',
          isCurrentTurn && 'animate-pulse-glow border-status-active',
          isPartner && 'glow-partner',
        )}
      >
        <span className="drop-shadow-lg">{hatEmojis[hatType]}</span>
      </div>
      <span
        className={cn(
          nameSizeClasses[size],
          'font-display text-cream truncate max-w-20 text-center',
          isCurrentTurn && 'text-status-active',
          isPartner && 'text-gold-light',
        )}
      >
        {nickname}
      </span>
      {team && (
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full font-semibold',
            team === 'A' ? 'bg-team-a/20 text-team-a-light' : 'bg-team-b/20 text-team-b-light'
          )}
        >
          Drużyna {team}
        </span>
      )}
    </div>
  );
};
