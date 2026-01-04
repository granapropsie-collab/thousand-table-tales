import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GameTable } from '@/components/GameTable';
import { Player, Card, Suit } from '@/types/game';
import { cn } from '@/lib/utils';

// Mock data for demonstration
const generateMockCards = (count: number): Card[] => {
  const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks: ('A' | '10' | 'K' | 'Q' | 'J' | '9')[] = ['A', '10', 'K', 'Q', 'J', '9'];
  const cards: Card[] = [];
  
  for (let i = 0; i < count; i++) {
    cards.push({
      id: `card-${i}`,
      suit: suits[i % 4],
      rank: ranks[i % 6],
    });
  }
  
  return cards;
};

const mockPlayers: Player[] = [
  { id: '1', nickname: 'Ty', team: 'A', isReady: true, isHost: true, cards: generateMockCards(5), isCurrentTurn: true },
  { id: '2', nickname: 'Doc Holliday', team: 'B', isReady: true, isHost: false, cards: generateMockCards(5), isCurrentTurn: false },
  { id: '3', nickname: 'Calamity Jane', team: 'A', isReady: true, isHost: false, cards: generateMockCards(5), isCurrentTurn: false },
  { id: '4', nickname: 'Wild Bill', team: 'B', isReady: true, isHost: false, cards: generateMockCards(5), isCurrentTurn: false },
];

const mockTrick: Card[] = [
  { id: 'trick-1', suit: 'hearts', rank: 'K' },
  { id: 'trick-2', suit: 'hearts', rank: '10' },
];

const currentPlayerId = '1';

const Game = () => {
  const navigate = useNavigate();
  const { gameId } = useParams();
  const [players] = useState<Player[]>(mockPlayers);
  const [currentTrick] = useState<Card[]>(mockTrick);
  const [trump] = useState<Suit>('hearts');
  const [teamScores] = useState({ A: 340, B: 280 });
  const [teamNames] = useState({ A: 'Betoniarze', B: 'Asy Kier' });
  const [showBidding, setShowBidding] = useState(false);
  const [currentBid, setCurrentBid] = useState(100);

  const handleLeaveGame = () => {
    // In real app, would confirm and handle cleanup
    navigate('/');
  };

  const handleBid = (amount: number) => {
    setCurrentBid(amount);
    // Would send to server
  };

  const handlePass = () => {
    setShowBidding(false);
    // Would send to server
  };

  return (
    <div className="min-h-screen felt-texture vignette overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleLeaveGame}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Wyjdź
            </Button>
            
            <h1 className="text-lg font-display gold-text">Tysiąc</h1>
            
            <Button variant="ghost" size="sm">
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Game Table */}
      <main className="pt-16 pb-8 px-4 h-screen flex items-center justify-center">
        <GameTable
          players={players}
          currentPlayerId={currentPlayerId}
          currentTrick={currentTrick}
          trump={trump}
          teamScores={teamScores}
          teamNames={teamNames}
        />
      </main>

      {/* Bidding Modal */}
      {showBidding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h2 className="text-xl font-display text-cream text-center mb-6">Licytacja</h2>
            
            <div className="text-center mb-6">
              <span className="text-muted-foreground">Aktualna oferta:</span>
              <span className="text-3xl font-display text-gold ml-3">{currentBid}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[10, 20, 30].map((increment) => (
                <Button
                  key={increment}
                  variant="outline"
                  onClick={() => handleBid(currentBid + increment)}
                >
                  +{increment}
                </Button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={handlePass}>
                Pas
              </Button>
              <Button variant="gold" className="flex-1" onClick={() => setShowBidding(false)}>
                Licytuję {currentBid + 10}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Meld Indicator (when applicable) */}
      <div className="fixed bottom-4 left-4 bg-card/90 backdrop-blur px-4 py-2 rounded-lg border border-gold/30">
        <span className="text-muted-foreground text-sm mr-2">Meldunki:</span>
        <span className="text-gold">👑👸 Kier (100)</span>
      </div>

      {/* Demo Toggle */}
      <Button
        variant="secondary"
        size="sm"
        className="fixed bottom-4 right-4"
        onClick={() => setShowBidding(!showBidding)}
      >
        {showBidding ? 'Zamknij licytację' : 'Pokaż licytację'}
      </Button>
    </div>
  );
};

export default Game;
