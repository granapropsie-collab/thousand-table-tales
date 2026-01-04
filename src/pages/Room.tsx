import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Users, Music, Crown, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamSelector } from '@/components/TeamSelector';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useGameState, RoomPlayer } from '@/hooks/useGameState';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const Room = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const { 
    room, 
    playerId, 
    isHost, 
    currentPlayer,
    selectTeam, 
    updateTeamName, 
    setReady, 
    startGame, 
    leaveRoom 
  } = useGameState(roomId);

  const [copied, setCopied] = useState(false);

  // Redirect to game when it starts
  useEffect(() => {
    if (room?.status === 'playing') {
      navigate(`/game/${roomId}`);
    }
  }, [room?.status, roomId, navigate]);

  if (!room) {
    return (
      <div className="min-h-screen wood-texture flex items-center justify-center">
        <div className="text-cream text-xl font-display animate-pulse">
          Ładowanie pokoju...
        </div>
      </div>
    );
  }

  const teamAPlayers = room.room_players.filter((p) => p.team === 'A');
  const teamBPlayers = room.room_players.filter((p) => p.team === 'B');
  const canStartGame = room.room_players.length === 4 && teamAPlayers.length === 2 && teamBPlayers.length === 2;

  const handleJoinTeam = async (team: 'A' | 'B') => {
    await selectTeam(team);
    toast.success(`Dołączyłeś do drużyny ${team === 'A' ? room.team_a_name : room.team_b_name}`);
  };

  const handleUpdateTeamName = async (teamId: 'A' | 'B', name: string) => {
    await updateTeamName(teamId, name);
  };

  const handleStartGame = async () => {
    await startGame();
  };

  const handleLeaveRoom = async () => {
    await leaveRoom();
    navigate('/');
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Skopiowano link!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Convert RoomPlayer to Player format for TeamSelector
  const convertPlayer = (p: RoomPlayer) => ({
    id: p.player_id,
    nickname: p.nickname,
    team: p.team,
    isReady: p.is_ready,
    isHost: p.is_host,
    cards: [],
    isCurrentTurn: false,
  });

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
              <h1 className="text-2xl font-display gold-text">{room.name}</h1>
              {room.with_musik && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gold/20 text-gold">
                  <Music className="w-3 h-3" />
                  Z musikiem
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>{room.room_players.length}/4</span>
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
            {room.room_players.map((player, index) => (
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
                  {player.is_host && (
                    <Crown className="absolute -top-2 -right-2 w-5 h-5 text-gold" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    player.is_ready
                      ? 'bg-status-active/20 text-status-active'
                      : 'bg-status-waiting/20 text-status-waiting'
                  )}
                >
                  {player.is_ready ? 'Gotowy' : 'Oczekuje'}
                </span>
              </div>
            ))}
            
            {Array.from({ length: 4 - room.room_players.length }).map((_, i) => (
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
              teamName={room.team_a_name}
              players={teamAPlayers.map(convertPlayer)}
              currentPlayerId={playerId}
              isEditable={isHost}
              onJoinTeam={handleJoinTeam}
              onUpdateName={(name) => handleUpdateTeamName('A', name)}
            />
            <TeamSelector
              teamId="B"
              teamName={room.team_b_name}
              players={teamBPlayers.map(convertPlayer)}
              currentPlayerId={playerId}
              isEditable={isHost}
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
            <span className="text-muted-foreground text-sm">Kod pokoju:</span>
            <code className="text-gold font-mono text-lg font-bold">
              {room.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Room;
