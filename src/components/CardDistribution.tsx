import { useState } from 'react';
import { Card as CardType, RoomPlayer } from '@/hooks/useGameState';
import { PlayingCard } from './PlayingCard';
import { Button } from '@/components/ui/button';
import { User, Check } from 'lucide-react';

interface CardDistributionProps {
  myCards: CardType[];
  otherPlayers: RoomPlayer[];
  onDistribute: (cardId: string, targetPlayerId: string) => Promise<void>;
}

export const CardDistribution = ({ myCards, otherPlayers, onDistribute }: CardDistributionProps) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [isDistributing, setIsDistributing] = useState(false);

  // Check which players already received cards (using tricks_won as marker)
  const playersWhoReceived = otherPlayers.filter(p => 
    (p.tricks_won || []).some((t: any) => t.type === 'distributed_card')
  );
  
  const playersWaiting = otherPlayers.filter(p => 
    !(p.tricks_won || []).some((t: any) => t.type === 'distributed_card')
  );

  const remainingToDistribute = playersWaiting.length;

  const handleSelectPlayer = async (targetPlayerId: string) => {
    if (!selectedCard || isDistributing) return;
    
    setIsDistributing(true);
    try {
      await onDistribute(selectedCard, targetPlayerId);
      setSelectedCard(null);
    } finally {
      setIsDistributing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm p-4 safe-area-bottom">
      <div className="bg-card border border-gold/50 rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-4 animate-scale-in">
        <h2 className="text-lg sm:text-xl font-display text-gold text-center mb-2">
          Rozdaj karty
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-4">
          Wygrałeś licytację! Rozdaj po jednej karcie każdemu graczowi.
          <br />
          <span className="text-cream">Pozostało do rozdania: {remainingToDistribute}</span>
        </p>

        {/* Players to give cards to */}
        <div className="flex justify-center gap-3 mb-6">
          {otherPlayers.map((player) => {
            const hasReceived = playersWhoReceived.some(p => p.player_id === player.player_id);
            
            return (
              <Button
                key={player.player_id}
                variant={hasReceived ? "outline" : "ghost"}
                className={`flex flex-col items-center p-3 h-auto ${
                  hasReceived 
                    ? 'border-green-500/50 bg-green-500/10 cursor-not-allowed' 
                    : selectedCard 
                      ? 'hover:bg-gold/20 border-gold/50 border-2' 
                      : 'opacity-50 cursor-not-allowed'
                }`}
                disabled={hasReceived || !selectedCard || isDistributing}
                onClick={() => handleSelectPlayer(player.player_id)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  hasReceived ? 'bg-green-500/30' : 'bg-cream-dark/30'
                }`}>
                  {hasReceived ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <User className="w-5 h-5 text-cream" />
                  )}
                </div>
                <span className="text-xs text-cream mt-1 truncate max-w-[80px]">
                  {player.nickname}
                </span>
                {hasReceived && (
                  <span className="text-[10px] text-green-400">Otrzymał</span>
                )}
              </Button>
            );
          })}
        </div>

        {/* Instructions */}
        <p className="text-xs text-muted-foreground text-center mb-3">
          {selectedCard 
            ? 'Kliknij gracza, któremu chcesz dać tę kartę' 
            : 'Wybierz kartę do oddania'}
        </p>

        {/* My cards */}
        <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
          {myCards.map((card) => (
            <div
              key={card.id}
              className="cursor-pointer transition-transform"
              onClick={() => setSelectedCard(card.id === selectedCard ? null : card.id)}
            >
              <PlayingCard
                card={card}
                size="sm"
                isSelected={card.id === selectedCard}
                isPlayable={!isDistributing}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
