import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameTable } from '@/components/GameTable';
import { useGameState } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
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
  const { playSound, toggleSound, soundEnabled } = useSoundEffects();

  const [showBidding, setShowBidding] = useState(false);
  const [showTrumpSelect, setShowTrumpSelect] = useState(false);
  const prevIsMyTurn = useRef(isMyTurn);

  // Play sound when it becomes my turn
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurn.current) {
      playSound('your_turn');
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn, playSound]);

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

  // Play sound when trick is complete
  useEffect(() => {
    if (currentTrick.length === (room?.room_players.length || 4)) {
      playSound('trick_win');
    }
  }, [currentTrick.length, room?.room_players.length, playSound]);

  const handleLeaveGame = async () => {
    playSound('click');
    await leaveRoom();
    navigate('/');
  };

  const handleBid = async (amount: number) => {
    playSound('bid');
    await bid(amount);
  };

  const handlePass = async () => {
    playSound('pass');
    await pass();
  };

  const handleSelectTrump = async (trump: string) => {
    playSound('meld');
    await selectTrump(trump);
    setShowTrumpSelect(false);
  };

  const handlePlayCard = async (cardId: string) => {
    playSound('card_play');
    await playCard(cardId);
  };

  if (!room) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center safe-area-bottom"
        style={{ 
          backgroundImage: `url(${tableFeltImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="text-cream text-lg sm:text-xl font-display animate-pulse">
          Ładowanie gry...
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen overflow-hidden relative safe-area-bottom"
      style={{ 
        backgroundImage: `url(${tableFeltImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Vignette overlay */}
      <div className="absolute inset-0 vignette pointer-events-none" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50 safe-area-top">
        <div className="container mx-auto px-2 sm:px-4 py-1.5 sm:py-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleLeaveGame} className="touch-target text-xs sm:text-sm">
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Wyjdź</span>
            </Button>
            
            <h1 className="text-sm sm:text-lg font-display gold-text">
              Tysiąc - Runda {room.round_number}
            </h1>
            
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSound}
                className="touch-target"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="touch-target">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Game Table */}
      <main className="pt-12 sm:pt-16 pb-4 sm:pb-8 px-2 sm:px-4 h-screen flex items-center justify-center relative z-10">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 safe-area-bottom">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h2 className="text-lg sm:text-xl font-display text-cream text-center mb-4 sm:mb-6">Licytacja</h2>
            
            <div className="text-center mb-4 sm:mb-6">
              <span className="text-muted-foreground text-sm">Aktualna oferta:</span>
              <span className="text-2xl sm:text-3xl font-display text-gold ml-2 sm:ml-3">{room.current_bid}</span>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mb-4 sm:mb-6">
              {[10, 20, 30, 50].map((increment) => (
                <Button
                  key={increment}
                  variant="outline"
                  size="sm"
                  onClick={() => handleBid(room.current_bid + increment)}
                  className="touch-target text-sm"
                >
                  +{increment}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-2 sm:gap-3">
              <Button variant="destructive" className="flex-1 touch-target" onClick={handlePass}>
                Pas
              </Button>
              <Button variant="gold" className="flex-1 touch-target" onClick={() => handleBid(room.current_bid + 10)}>
                Licytuję {room.current_bid + 10}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Trump Selection Modal */}
      {showTrumpSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 safe-area-bottom">
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 max-w-sm w-full mx-4 animate-scale-in">
            <h2 className="text-lg sm:text-xl font-display text-cream text-center mb-4 sm:mb-6">Wybierz Atut</h2>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-red-500 text-2xl sm:text-3xl h-16 sm:h-20 touch-target flex flex-col"
                onClick={() => handleSelectTrump('hearts')}
              >
                <span>♥</span>
                <span className="text-xs text-muted-foreground">Kier +100</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-red-500 text-2xl sm:text-3xl h-16 sm:h-20 touch-target flex flex-col"
                onClick={() => handleSelectTrump('diamonds')}
              >
                <span>♦</span>
                <span className="text-xs text-muted-foreground">Karo +80</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-cream text-2xl sm:text-3xl h-16 sm:h-20 touch-target flex flex-col"
                onClick={() => handleSelectTrump('clubs')}
              >
                <span>♣</span>
                <span className="text-xs text-muted-foreground">Trefl +60</span>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="text-cream text-2xl sm:text-3xl h-16 sm:h-20 touch-target flex flex-col"
                onClick={() => handleSelectTrump('spades')}
              >
                <span>♠</span>
                <span className="text-xs text-muted-foreground">Pik +40</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;
