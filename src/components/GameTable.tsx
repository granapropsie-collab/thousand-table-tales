import { useState, useCallback } from 'react';
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
  isPlayingCard?: boolean;
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
  isPlayingCard = false,
}: GameTableProps) => {
  const players = room.room_players;
  const playerCount = players.length;
  
  // Order players: current player at bottom, then clockwise
  const currentPlayerIndex = players.findIndex((p) => p.player_id === playerId);
  const orderedPlayers = [
    ...players.slice(currentPlayerIndex),
    ...players.slice(0, currentPlayerIndex),
  ];

  // Get positions based on player count
  const getPlayerPositions = () => {
    switch (playerCount) {
      case 2:
        return ['bottom', 'top'];
      case 3:
        return ['bottom', 'left', 'right'];
      case 4:
      default:
        return ['bottom', 'right', 'top', 'left'];
    }
  };

  const positions = getPlayerPositions();

  const currentPlayer = players.find((p) => p.player_id === playerId);
  const playerTeam = currentPlayer?.team;
  const isTeamMode = room.game_mode === 'teams';

  const isPartner = (player: RoomPlayer) => {
    return isTeamMode && playerTeam && player.team === playerTeam && player.player_id !== playerId;
  };

  const getPlayerTrickCard = (player: RoomPlayer) => {
    return currentTrick.find((t) => t.player_id === player.player_id);
  };

  // Calculate lead suit for validation
  const leadSuit = currentTrick[0]?.card?.suit || null;
  
  const canPlayCard = (card: Card) => {
    if (!isMyTurn || room.phase !== 'playing' || isPlayingCard) return false;
    if (!leadSuit) return true; // First card in trick
    
    const myCards = orderedPlayers[0]?.cards.filter(c => !c.hidden) || [];
    const hasSuit = myCards.some((c) => c.suit === leadSuit);
    if (hasSuit) return card.suit === leadSuit;
    return true;
  };

  // Position classes for different layouts
  const positionStyles: Record<string, Record<string, string>> = {
    bottom: {
      container: 'absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2',
      cards: 'flex gap-0.5 sm:gap-1 -space-x-2 sm:-space-x-4',
    },
    top: {
      container: 'absolute top-12 sm:top-16 left-1/2 -translate-x-1/2',
      cards: 'flex -space-x-6 sm:-space-x-8',
    },
    left: {
      container: 'absolute left-2 sm:left-8 top-1/2 -translate-y-1/2',
      cards: 'flex flex-col -space-y-8 sm:-space-y-10',
    },
    right: {
      container: 'absolute right-2 sm:right-8 top-1/2 -translate-y-1/2',
      cards: 'flex flex-col -space-y-8 sm:-space-y-10',
    },
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[4/3] sm:aspect-[4/3] no-select">
      {/* Table */}
      <div 
        className="absolute inset-0 rounded-[30%/40%] sm:rounded-[40%/50%] overflow-hidden shadow-2xl border-4 sm:border-8 border-wood-dark"
        style={{ 
          backgroundImage: `url(${tableFeltImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Vignette overlay */}
        <div className="absolute inset-0 vignette" />
        {/* Wood border effect */}
        <div className="absolute inset-0 rounded-[30%/40%] sm:rounded-[40%/50%] border-2 sm:border-4 border-wood-light/20" />
      </div>

      {/* Center - Current Trick */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 sm:gap-2">
        {currentTrick.map((trick, index) => (
          <PlayingCard
            key={trick.id}
            card={trick.card}
            size="sm"
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
          <div className="w-12 h-[72px] sm:w-16 sm:h-24 rounded-lg border-2 border-dashed border-cream/20 flex items-center justify-center">
            <span className="text-cream/30 text-[10px] sm:text-sm text-center px-1">Zagraj kartę</span>
          </div>
        )}
      </div>

      {/* Trump indicator */}
      {room.current_trump && (
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-gold/30 animate-fade-in z-20">
          <span className="text-muted-foreground text-xs sm:text-sm mr-1 sm:mr-2">Atut:</span>
          <span
            className={cn(
              'text-lg sm:text-2xl',
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
        <div className="absolute top-2 sm:top-4 left-1/2 -translate-x-1/2 bg-gold/90 text-primary-foreground px-3 sm:px-4 py-1 sm:py-2 rounded-lg animate-pulse-glow z-20">
          <span className="font-display text-sm sm:text-base">Licytacja: {room.current_bid}</span>
        </div>
      )}

      {/* Score Panel - Different layout for FFA vs Teams */}
      <div className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-card/90 backdrop-blur px-2 sm:px-4 py-2 sm:py-3 rounded-lg border border-border space-y-1 z-10 max-w-[120px] sm:max-w-none">
        {isTeamMode ? (
          <>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-team-a flex-shrink-0" />
              <span className="text-cream text-xs sm:text-sm font-medium truncate">{room.team_a_name}:</span>
              <span className="text-gold font-display text-sm sm:text-base">{room.team_a_score}</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-team-b flex-shrink-0" />
              <span className="text-cream text-xs sm:text-sm font-medium truncate">{room.team_b_name}:</span>
              <span className="text-gold font-display text-sm sm:text-base">{room.team_b_score}</span>
            </div>
          </>
        ) : (
          <>
            {orderedPlayers.slice(0, 4).map((player, i) => {
              // Calculate current round points including melds
              const meldPoints = (player.melds || []).reduce((sum, m) => sum + m.points, 0);
              const currentRoundTotal = (player.round_score || 0) + meldPoints;
              const totalWithCurrentRound = (player.total_score || 0) + currentRoundTotal;
              
              return (
                <div key={player.id} className="flex items-center gap-1 sm:gap-2">
                  <span className="text-cream text-[10px] sm:text-xs truncate max-w-12 sm:max-w-20">{player.nickname}</span>
                  <span className="text-gold font-display text-xs sm:text-sm ml-auto">{totalWithCurrentRound}</span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Players around the table */}
      {orderedPlayers.map((player, index) => {
        const position = positions[index];
        if (!position) return null;
        
        const isCurrentTurn = room.current_player_id === player.player_id;
        const isMe = player.player_id === playerId;
        const styles = positionStyles[position];

        if (isMe) {
          // Current player's hand at bottom
          return (
            <div key={player.id} className={cn(styles.container, 'z-20')}>
              <div className="flex flex-col items-center gap-1 sm:gap-2">
                <div className={styles.cards}>
                  {player.cards
                    .filter(c => !c.hidden)
                    .map((card, i) => (
                      <PlayingCard
                        key={card.id}
                        card={card}
                        size={window.innerWidth < 640 ? 'sm' : 'lg'}
                        isPlayable={canPlayCard(card)}
                        onClick={() => canPlayCard(card) && onPlayCard(card.id)}
                        isAnimating
                        animationDelay={i * 100}
                        className={cn(
                          'transition-transform active:scale-95',
                          window.innerWidth < 640 && 'mobile-card-md'
                        )}
                      />
                    ))}
                </div>
                <PlayerAvatar
                  nickname={player.nickname}
                  hatType={hatTypes[0]}
                  team={isTeamMode ? player.team : null}
                  isCurrentTurn={isCurrentTurn}
                  size="sm"
                />
              </div>
            </div>
          );
        }

        // Other players
        const isHorizontal = position === 'top' || position === 'bottom';
        
        return (
          <div key={player.id} className={cn(styles.container, 'z-10')}>
            <div className={cn(
              'flex items-center gap-1 sm:gap-2',
              isHorizontal ? 'flex-col' : position === 'left' ? 'flex-row' : 'flex-row-reverse'
            )}>
              <PlayerAvatar
                nickname={player.nickname}
                hatType={hatTypes[index % 4]}
                team={isTeamMode ? player.team : null}
                isCurrentTurn={isCurrentTurn}
                isPartner={isPartner(player)}
                size="sm"
              />
              <div className={cn(
                styles.cards,
                !isHorizontal && 'max-h-32 sm:max-h-48'
              )}>
                {player.cards.slice(0, Math.min(player.cards.length, 5)).map((card, i) => (
                  <PlayingCard
                    key={card.id}
                    card={isPartner(player) && !card.hidden ? card : undefined}
                    faceDown={!isPartner(player) || card.hidden}
                    size="sm"
                    className={cn(
                      'opacity-90',
                      window.innerWidth < 640 && 'mobile-card-sm'
                    )}
                    isAnimating
                    animationDelay={i * 50}
                  />
                ))}
                {player.cards.length > 5 && (
                  <div className="flex items-center justify-center bg-card/60 rounded px-1 text-[10px] sm:text-xs text-cream/70">
                    +{player.cards.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Melds indicator */}
      {currentPlayer?.melds && currentPlayer.melds.length > 0 && (
        <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 bg-card/90 backdrop-blur px-2 sm:px-4 py-1 sm:py-2 rounded-lg border border-gold/30 z-10">
          <span className="text-muted-foreground text-[10px] sm:text-sm mr-1 sm:mr-2">Meldunki:</span>
          {currentPlayer.melds.map((meld, i) => (
            <span key={i} className="text-gold text-xs sm:text-sm">
              👑👸 {meld.suit === 'hearts' ? 'Kier' : meld.suit === 'diamonds' ? 'Karo' : meld.suit === 'clubs' ? 'Trefl' : 'Pik'} ({meld.points})
              {i < currentPlayer.melds.length - 1 && ', '}
            </span>
          ))}
        </div>
      )}

      {/* Turn indicator for mobile */}
      {isMyTurn && room.phase === 'playing' && (
        <div className="absolute bottom-24 sm:bottom-36 left-1/2 -translate-x-1/2 bg-status-active/90 text-cream px-3 py-1 rounded-full text-xs sm:text-sm font-medium animate-bounce-subtle z-20">
          Twój ruch!
        </div>
      )}
    </div>
  );
};
