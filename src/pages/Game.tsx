import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameTable } from '@/components/GameTable';
import { useGameState } from '@/hooks/useGameState';
import { cn } from '@/lib/utils';
import tableFeltImage from '@/assets/table-felt.jpg';

const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const { 
    room, 
    currentTrick, 
    playerId, 
    isMyTurn, 
    bid, 
    pass, 
    selectTrump, 
    playCard, 
    leaveRoom 
  } = useGameState(gameId);

  const [showBidding, setShowBidding] = useState(false);
  const [showTrumpSelect, setShowTrumpSelect] = useState(false);

  // Show bidding modal when in bidding phase and it's my turn
  useEffect(() => {
    if (room?.phase === 'bidding' && isMyTurn) {
      setShowBidding(true);
    } else {
      setShowBidding(false);
    }
  }, [room?.phase, isMyTurn]);

  // Show trump selection for bid winner
  useEffect(() => {
    if (room?.phase === 'playing' && room.bid_winner_id === playerId && !room.current_trump) {
      setShowTrumpSelect(true);
    } else {
      setShowTrumpSelect(false);
    }
  }, [room?.phase, room?.bid_winner_id, room?.current_trump, playerId]);

  const handleLeaveGame = async () => {
    await leaveRoom();
    navigate('/');
  };

  const handleBid = async (amount: number) => {
    await bid(amount);
  };

  const handlePass = async () => {
    await pass();
  };

  const handleSelectTrump = async (trump: string) => {
    await selectTrump(trump);
    setShowTrumpSelect(false);
  };

  const handlePlayCard = async (cardId: string) => {
    await playCard(cardId);
  };

  if (!room) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundImage: `url(${tableFeltImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-cream text-xl font-display animate-pulse">
          Ładowanie gry...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-hidden relative"
      style={{ 
        backgroundImage: `url(${tableFeltImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Vignette overlay */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleLeaveGame}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Wyjdź
            </Button>
            
            <h1 className="text-lg font-display gold-text">Tysiąc - Runda {room.round_number}</h1>
            
            <Button variant="ghost" size="sm">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Game Table */}
      <main className="pt-16 pb-8 px-4 h-screen flex items-center justify-center relative z-10">
        <GameTable
          room={room}
          currentTrick={currentTrick}
          playerId={playerId}
          onPlayCard={handlePlayCard}
          isMyTurn={isMyTurn}
        />
      </main>

      {/* Bidding Modal */}
      {showBidding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h2 className="text-xl font-display text-cream text-center mb-6">Licytacja</h2>
            
            <div className="text-center mb-6">
              <span className="text-muted-foreground">Aktualna oferta:</span>
              <span className="text-3xl font-display text-gold ml-3">{room.current_bid}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[10, 20, 30].map((increment) => (
                <Button
                  key={increment}
                  variant="outline"
                  onClick={() => handleBid(room.current_bid + increment)}
                >
                  +{increment}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={handlePass}>
                Pas
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => handleBid(room.current_bid + 10)}>
                Licytuję {room.current_bid + 10}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trump Selection Modal */}
      {showTrumpSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h2 className="text-xl font-display text-cream text-center mb-6">Wybierz Atut</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-red-500 text-3xl h-20"
                onClick={() => handleSelectTrump('hearts')}
              >
                ♥ Kier
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-red-500 text-3xl h-20"
                onClick={() => handleSelectTrump('diamonds')}
              >
                ♦ Karo
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-cream text-3xl h-20"
                onClick={() => handleSelectTrump('clubs')}
              >
                ♣ Trefl
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-cream text-3xl h-20"
                onClick={() => handleSelectTrump('spades')}
              >
                ♠ Pik
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
