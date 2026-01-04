import { Card, Player, Suit } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '@/lib/utils';

interface GameTableProps {
  players: Player[];
  currentPlayerId: string;
  currentTrick: Card[];
  trump: Suit | null;
  teamScores: { A: number; B: number };
  teamNames: { A: string; B: string };
}

const suitSymbols: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const hatTypes = ['cowboy', 'bowler', 'sombrero', 'tophat'] as const;

export const GameTable = ({
  players,
  currentPlayerId,
  currentTrick,
  trump,
  teamScores,
  teamNames,
}: GameTableProps) => {
  // Order players: current player at bottom, then clockwise
  const currentPlayerIndex = players.findIndex((p) => p.id === currentPlayerId);
  const orderedPlayers = [
    ...players.slice(currentPlayerIndex),
    ...players.slice(0, currentPlayerIndex),
  ];

  const [bottomPlayer, rightPlayer, topPlayer, leftPlayer] = orderedPlayers;

  const getPartner = (player: Player) => {
    return players.find((p) => p.team === player.team && p.id !== player.id);
  };

  const isPartner = (player: Player) => {
    const currentPlayer = players.find((p) => p.id === currentPlayerId);
    return currentPlayer?.team === player.team && player.id !== currentPlayerId;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3]">
      {/* Table */}
      <div className="absolute inset-0 rounded-[50%] felt-texture vignette shadow-2xl border-8 border-wood-dark">
        {/* Wood border effect */}
        <div className="absolute inset-0 rounded-[50%] border-4 border-wood-light/20" />
      </div>

      {/* Center - Current Trick */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
        {currentTrick.map((card, index) => (
          <PlayingCard
            key={card.id}
            card={card}
            size="md"
            className={cn(
              'animate-scale-in',
              index === 0 && '-rotate-6',
              index === 1 && 'rotate-3',
              index === 2 && '-rotate-3',
              index === 3 && 'rotate-6'
            )}
          />
        ))}
        {currentTrick.length === 0 && (
          <div className="w-16 h-22 rounded-lg border-2 border-dashed border-cream/20 flex items-center justify-center">
            <span className="text-cream/30 text-sm">Lewa</span>
          </div>
        )}
      </div>

      {/* Trump indicator */}
      {trump && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-4 py-2 rounded-lg border border-gold/30">
          <span className="text-muted-foreground text-sm mr-2">Atut:</span>
          <span
            className={cn(
              'text-2xl',
              trump === 'hearts' || trump === 'diamonds' ? 'text-red-500' : 'text-cream'
            )}
          >
            {suitSymbols[trump]}
          </span>
        </div>
      )}

      {/* Score Panel */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur px-4 py-3 rounded-lg border border-border space-y-1">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-team-a" />
          <span className="text-cream text-sm font-medium">{teamNames.A}:</span>
          <span className="text-gold font-display">{teamScores.A}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-team-b" />
          <span className="text-cream text-sm font-medium">{teamNames.B}:</span>
          <span className="text-gold font-display">{teamScores.B}</span>
        </div>
      </div>

      {/* Bottom Player (Current User) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex gap-1">
          {bottomPlayer?.cards.map((card) => (
            <PlayingCard
              key={card.id}
              card={card}
              size="lg"
              isPlayable={bottomPlayer.isCurrentTurn}
              className="animate-card-hover"
            />
          ))}
        </div>
        <PlayerAvatar
          nickname={bottomPlayer?.nickname || 'Ty'}
          hatType={hatTypes[0]}
          team={bottomPlayer?.team}
          isCurrentTurn={bottomPlayer?.isCurrentTurn}
          size="sm"
        />
      </div>

      {/* Right Player */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <PlayerAvatar
          nickname={rightPlayer?.nickname || '?'}
          hatType={hatTypes[1]}
          team={rightPlayer?.team}
          isCurrentTurn={rightPlayer?.isCurrentTurn}
          isPartner={rightPlayer && isPartner(rightPlayer)}
          size="sm"
        />
        <div className="flex flex-col gap-0.5">
          {rightPlayer?.cards.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={isPartner(rightPlayer) ? card : undefined}
              faceDown={!isPartner(rightPlayer)}
              size="sm"
              className={cn('opacity-80', i > 0 && '-mt-12')}
            />
          ))}
        </div>
      </div>

      {/* Top Player */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <PlayerAvatar
          nickname={topPlayer?.nickname || '?'}
          hatType={hatTypes[2]}
          team={topPlayer?.team}
          isCurrentTurn={topPlayer?.isCurrentTurn}
          isPartner={topPlayer && isPartner(topPlayer)}
          size="sm"
        />
        <div className="flex gap-0.5">
          {topPlayer?.cards.map((card) => (
            <PlayingCard
              key={card.id}
              card={isPartner(topPlayer) ? card : undefined}
              faceDown={!isPartner(topPlayer)}
              size="sm"
              className="opacity-80"
            />
          ))}
        </div>
      </div>

      {/* Left Player */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
        <div className="flex flex-col gap-0.5">
          {leftPlayer?.cards.map((card, i) => (
            <PlayingCard
              key={card.id}
              card={isPartner(leftPlayer) ? card : undefined}
              faceDown={!isPartner(leftPlayer)}
              size="sm"
              className={cn('opacity-80', i > 0 && '-mt-12')}
            />
          ))}
        </div>
        <PlayerAvatar
          nickname={leftPlayer?.nickname || '?'}
          hatType={hatTypes[3]}
          team={leftPlayer?.team}
          isCurrentTurn={leftPlayer?.isCurrentTurn}
          isPartner={leftPlayer && isPartner(leftPlayer)}
          size="sm"
        />
      </div>
    </div>
  );
};
