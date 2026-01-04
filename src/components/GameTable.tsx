import { Room, RoomPlayer, TrickCard, Card } from '@/hooks/useGameState';
import { PlayingCard } from './PlayingCard';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '@/lib/utils';
import tableFeltImage from '@/assets/table-felt.jpg';

interface GameTableProps {
  room: Room;
  currentTrick: TrickCard[];
  playerId: string;
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const hatTypes = ['cowboy', 'bowler', 'sombrero', 'tophat'] as const;

export const GameTable = ({
  room,
  currentTrick,
  playerId,
  onPlayCard,
  isMyTurn,
}: GameTableProps) => {
  const players = room.room_players;
  
  // Order players: current player at bottom, then clockwise
  const currentPlayerIndex = players.findIndex((p) => p.player_id === playerId);
  const orderedPlayers = [
    ...players.slice(currentPlayerIndex),
    ...players.slice(0, currentPlayerIndex),
  ];

  const [bottomPlayer, rightPlayer, topPlayer, leftPlayer] = orderedPlayers;
  const currentPlayer = players.find((p) => p.player_id === playerId);
  const playerTeam = currentPlayer?.team;

  const isPartner = (player: RoomPlayer) => {
    return playerTeam && player.team === playerTeam && player.player_id !== playerId;
  };

  const getPlayerTrickCard = (player: RoomPlayer) => {
    return currentTrick.find((t) => t.player_id === player.player_id);
  };

  // Calculate lead suit for validation
  const leadSuit = currentTrick[0]?.card?.suit || null;
  
  const canPlayCard = (card: Card) => {
    if (!isMyTurn || room.phase !== 'playing') return false;
    if (!leadSuit) return true; // First card in trick
    
    const myCards = bottomPlayer?.cards.filter(c => !c.hidden) || [];
    const hasSuit = myCards.some((c) => c.suit === leadSuit);
    if (hasSuit) return card.suit === leadSuit;
    return true;
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3]">
      {/* Table */}
      <div 
        className="absolute inset-0 rounded-[40%/50%] overflow-hidden shadow-2xl border-8 border-wood-dark"
        style={{ 
          backgroundImage: `url(${tableFeltImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Vignette overlay */}
        <div className="absolute inset-0 vignette" />
        {/* Wood border effect */}
        <div className="absolute inset-0 rounded-[40%/50%] border-4 border-wood-light/20" />
      </div>

      {/* Center - Current Trick */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-2">
        {currentTrick.map((trick, index) => (
          <PlayingCard
            key={trick.id}
            card={trick.card}
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
        {currentTrick.length === 0 && room.phase === 'playing' && (
          <div className="w-16 h-24 rounded-lg border-2 border-dashed border-cream/20 flex items-center justify-center">
            <span className="text-cream/30 text-sm text-center">Zagraj kartę</span>
          </div>
        )}
      </div>

      {/* Trump indicator */}
      {room.current_trump && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-4 py-2 rounded-lg border border-gold/30 animate-fade-in">
          <span className="text-muted-foreground text-sm mr-2">Atut:</span>
          <span
            className={cn(
              'text-2xl',
              room.current_trump === 'hearts' || room.current_trump === 'diamonds' 
                ? 'text-red-500' 
                : 'text-cream'
            )}
          >
            {suitSymbols[room.current_trump]}
          </span>
        </div>
      )}

      {/* Phase indicator */}
      {room.phase === 'bidding' && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-primary-foreground px-4 py-2 rounded-lg animate-pulse-glow">
          <span className="font-display">Licytacja: {room.current_bid}</span>
        </div>
      )}

      {/* Score Panel */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur px-4 py-3 rounded-lg border border-border space-y-1">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-team-a" />
          <span className="text-cream text-sm font-medium truncate max-w-20">{room.team_a_name}:</span>
          <span className="text-gold font-display">{room.team_a_score}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-team-b" />
          <span className="text-cream text-sm font-medium truncate max-w-20">{room.team_b_name}:</span>
          <span className="text-gold font-display">{room.team_b_score}</span>
        </div>
      </div>

      {/* Bottom Player (Current User) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex gap-1 -space-x-4">
          {bottomPlayer?.cards
            .filter(c => !c.hidden)
            .map((card, i) => (
              <PlayingCard
                key={card.id}
                card={card}
                size="lg"
                isPlayable={canPlayCard(card)}
                onClick={() => canPlayCard(card) && onPlayCard(card.id)}
                isAnimating
                animationDelay={i * 100}
              />
            ))}
        </div>
        <PlayerAvatar
          nickname={bottomPlayer?.nickname || 'Ty'}
          hatType={hatTypes[0]}
          team={bottomPlayer?.team}
          isCurrentTurn={room.current_player_id === bottomPlayer?.player_id}
          size="sm"
        />
      </div>

      {/* Right Player */}
      {rightPlayer && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <PlayerAvatar
            nickname={rightPlayer.nickname}
            hatType={hatTypes[1]}
            team={rightPlayer.team}
            isCurrentTurn={room.current_player_id === rightPlayer.player_id}
            isPartner={isPartner(rightPlayer)}
            size="sm"
          />
          <div className="flex flex-col -space-y-10">
            {rightPlayer.cards.map((card, i) => (
              <PlayingCard
                key={card.id}
                card={isPartner(rightPlayer) && !card.hidden ? card : undefined}
                faceDown={!isPartner(rightPlayer) || card.hidden}
                size="sm"
                className="opacity-90"
                isAnimating
                animationDelay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Top Player */}
      {topPlayer && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <PlayerAvatar
            nickname={topPlayer.nickname}
            hatType={hatTypes[2]}
            team={topPlayer.team}
            isCurrentTurn={room.current_player_id === topPlayer.player_id}
            isPartner={isPartner(topPlayer)}
            size="sm"
          />
          <div className="flex -space-x-8">
            {topPlayer.cards.map((card, i) => (
              <PlayingCard
                key={card.id}
                card={isPartner(topPlayer) && !card.hidden ? card : undefined}
                faceDown={!isPartner(topPlayer) || card.hidden}
                size="sm"
                className="opacity-90"
                isAnimating
                animationDelay={i * 50}
              />
            ))}
          </div>
        </div>
      )}

      {/* Left Player */}
      {leftPlayer && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="flex flex-col -space-y-10">
            {leftPlayer.cards.map((card, i) => (
              <PlayingCard
                key={card.id}
                card={isPartner(leftPlayer) && !card.hidden ? card : undefined}
                faceDown={!isPartner(leftPlayer) || card.hidden}
                size="sm"
                className="opacity-90"
                isAnimating
                animationDelay={i * 50}
              />
            ))}
          </div>
          <PlayerAvatar
            nickname={leftPlayer.nickname}
            hatType={hatTypes[3]}
            team={leftPlayer.team}
            isCurrentTurn={room.current_player_id === leftPlayer.player_id}
            isPartner={isPartner(leftPlayer)}
            size="sm"
          />
        </div>
      )}

      {/* Melds indicator */}
      {currentPlayer?.melds && currentPlayer.melds.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur px-4 py-2 rounded-lg border border-gold/30">
          <span className="text-muted-foreground text-sm mr-2">Meldunki:</span>
          {currentPlayer.melds.map((meld, i) => (
            <span key={i} className="text-gold">
              👑👸 {meld.suit === 'hearts' ? 'Kier' : meld.suit === 'diamonds' ? 'Karo' : meld.suit === 'clubs' ? 'Trefl' : 'Pik'} ({meld.points})
              {i < currentPlayer.melds.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
