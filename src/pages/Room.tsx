import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Users, Music, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamSelector } from '@/components/TeamSelector';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { Player } from '@/types/game';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock data
const mockPlayers: Player[] = [
  { id: '1', nickname: 'Wyga Billy', team: 'A', isReady: true, isHost: true, cards: [], isCurrentTurn: false },
  { id: '2', nickname: 'Calamity Jane', team: 'A', isReady: true, isHost: false, cards: [], isCurrentTurn: false },
  { id: '3', nickname: 'Doc Holliday', team: 'B', isReady: false, isHost: false, cards: [], isCurrentTurn: false },
];

const currentPlayerId = '1'; // Would come from auth

const Room = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [players, setPlayers] = useState<Player[]>(mockPlayers);
  const [teamNames, setTeamNames] = useState({ A: 'Betoniarze', B: 'Asy Kier' });
  const [withMusik] = useState(true);

  const currentPlayer = players.find((p) => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost;
  const teamAPlayers = players.filter((p) => p.team === 'A');
  const teamBPlayers = players.filter((p) => p.team === 'B');
  const canStartGame = players.length === 4 && teamAPlayers.length === 2 && teamBPlayers.length === 2;

  const handleJoinTeam = (teamId: 'A' | 'B') => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === currentPlayerId ? { ...p, team: teamId } : p))
    );
    toast.success(`Dołączyłeś do drużyny ${teamNames[teamId]}`);
  };

  const handleUpdateTeamName = (teamId: 'A' | 'B', name: string) => {
    setTeamNames((prev) => ({ ...prev, [teamId]: name }));
  };

  const handleStartGame = () => {
    toast.success('Rozpoczynanie gry...');
    navigate(`/game/${roomId}`);
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen wood-texture">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleLeaveRoom}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Wróć
            </Button>
            
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-display gold-text">Pokój: {roomId}</h1>
              {withMusik && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold/20 text-gold">
                  <Music className="w-3 h-3" />
                  Z musikiem
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>{players.length}/4</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Players List */}
        <section className="animate-fade-in">
          <h2 className="text-xl font-display text-cream mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            Gracze w pokoju
          </h2>
          
          <div className="flex flex-wrap gap-4 justify-center p-6 rounded-xl bg-card/50 border border-border">
            {players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg',
                  'bg-secondary/50 border border-border'
                )}
              >
                <div className="relative">
                  <PlayerAvatar
                    nickname={player.nickname}
                    hatType={['cowboy', 'bowler', 'sombrero', 'tophat'][index % 4] as any}
                    team={player.team}
                    size="lg"
                  />
                  {player.isHost && (
                    <Crown className="absolute -top-2 -right-2 w-5 h-5 text-gold" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    player.isReady
                      ? 'bg-status-active/20 text-status-active'
                      : 'bg-status-waiting/20 text-status-waiting'
                  )}
                >
                  {player.isReady ? 'Gotowy' : 'Oczekuje'}
                </span>
              </div>
            ))}
            
            {Array.from({ length: 4 - players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary/30 border border-dashed border-muted"
              >
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-3xl">?</span>
                </div>
                <span className="text-sm text-muted-foreground">Wolne miejsce</span>
              </div>
            ))}
          </div>
        </section>

        {/* Team Selection */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xl font-display text-cream mb-4">Wybór Drużyn</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <TeamSelector
              teamId="A"
              teamName={teamNames.A}
              players={teamAPlayers}
              currentPlayerId={currentPlayerId}
              isEditable={isHost || false}
              onJoinTeam={handleJoinTeam}
              onUpdateName={(name) => handleUpdateTeamName('A', name)}
            />
            <TeamSelector
              teamId="B"
              teamName={teamNames.B}
              players={teamBPlayers}
              currentPlayerId={currentPlayerId}
              isEditable={isHost || false}
              onJoinTeam={handleJoinTeam}
              onUpdateName={(name) => handleUpdateTeamName('B', name)}
            />
          </div>
        </section>

        {/* Start Game (Host Only) */}
        {isHost && (
          <section className="animate-fade-in text-center" style={{ animationDelay: '0.2s' }}>
            <Button
              variant="gold"
              size="xl"
              disabled={!canStartGame}
              onClick={handleStartGame}
              className="min-w-64"
            >
              <Play className="w-6 h-6" />
              Rozpocznij Grę
            </Button>
            
            {!canStartGame && (
              <p className="text-muted-foreground text-sm mt-3">
                Wymagane 4 osoby w drużynach 2 vs 2
              </p>
            )}
          </section>
        )}

        {/* Room Link */}
        <section className="animate-fade-in text-center" style={{ animationDelay: '0.3s' }}>
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-muted-foreground text-sm">Link do pokoju:</span>
            <code className="text-gold font-mono text-sm">
              {window.location.origin}/room/{roomId}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
                toast.success('Skopiowano link!');
              }}
            >
              Kopiuj
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Room;
