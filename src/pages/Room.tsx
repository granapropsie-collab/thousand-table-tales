import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Play, Users, Music, Crown, Copy, Check, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamSelector } from '@/components/TeamSelector';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useGameState, RoomPlayer } from '@/hooks/useGameState';
import { useSoundEffects } from '@/hooks/useSoundEffects';
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
  const { playSound, toggleSound, soundEnabled } = useSoundEffects();

  const [copied, setCopied] = useState(false);

  // Redirect to game when it starts
  useEffect(() => {
    if (room?.status === 'playing') {
      playSound('game_start');
      navigate(`/game/${roomId}`);
    }
  }, [room?.status, roomId, navigate, playSound]);

  if (!room) {
    return (
      <div className="min-h-screen wood-texture flex items-center justify-center safe-area-bottom">
        <div className="text-cream text-xl font-display animate-pulse">
          Ładowanie pokoju...
        </div>
      </div>
    );
  }

  const isTeamMode = room.game_mode === 'teams';
  const maxPlayers = room.max_players || 4;
  const teamAPlayers = room.room_players.filter((p) => p.team === 'A');
  const teamBPlayers = room.room_players.filter((p) => p.team === 'B');
  
  // Check if game can start based on mode
  const canStartGame = isTeamMode 
    ? room.room_players.length === 4 && teamAPlayers.length === 2 && teamBPlayers.length === 2
    : room.room_players.length >= 2 && room.room_players.length <= maxPlayers;

  const handleJoinTeam = async (team: 'A' | 'B') => {
    playSound('click');
    await selectTeam(team);
    toast.success(`Dołączyłeś do drużyny ${team === 'A' ? room.team_a_name : room.team_b_name}`);
  };

  const handleUpdateTeamName = async (teamId: 'A' | 'B', name: string) => {
    await updateTeamName(teamId, name);
  };

  const handleStartGame = async () => {
    playSound('game_start');
    await startGame();
  };

  const handleLeaveRoom = async () => {
    playSound('click');
    await leaveRoom();
    navigate('/');
  };

  const handleCopyLink = () => {
    playSound('click');
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
    <div className="min-h-screen wood-texture safe-area-bottom">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50 safe-area-top">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="touch-target">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Wróć</span>
            </Button>
            
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-center min-w-0">
              <h1 className="text-lg sm:text-2xl font-display gold-text truncate">{room.name}</h1>
              {room.with_musik && (
                <span className="flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-gold/20 text-gold flex-shrink-0">
                  <Music className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden sm:inline">Z musikiem</span>
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={toggleSound}
                className="touch-target"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{room.room_players.length}/{maxPlayers}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6 sm:space-y-8">
        {/* Game Mode Badge */}
        <div className="text-center animate-fade-in">
          <span className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
            isTeamMode ? 'bg-team-a/20 text-team-a-light' : 'bg-gold/20 text-gold'
          )}>
            {isTeamMode ? '🤝 Tryb drużynowy (2 vs 2)' : '⚔️ Każdy na siebie'}
            <span className="text-muted-foreground">• {maxPlayers} graczy</span>
          </span>
        </div>

        {/* Players List */}
        <section className="animate-fade-in">
          <h2 className="text-lg sm:text-xl font-display text-cream mb-3 sm:mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gold" />
            Gracze w pokoju
          </h2>
          
          <div className="flex flex-wrap gap-3 sm:gap-4 justify-center p-4 sm:p-6 rounded-xl bg-card/50 border border-border">
            {room.room_players.map((player, index) => (
              <div
                key={player.id}
                className={cn(
                  'flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg',
                  'bg-secondary/50 border border-border min-w-[90px] sm:min-w-[120px]'
                )}
              >
                <div className="relative">
                  <PlayerAvatar
                    nickname={player.nickname}
                    hatType={['cowboy', 'bowler', 'sombrero', 'tophat'][index % 4] as any}
                    team={isTeamMode ? player.team : null}
                    size={window.innerWidth < 640 ? 'sm' : 'lg'}
                  />
                  {player.is_host && (
                    <Crown className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 text-gold" />
                  )}
                </div>
                <span className="text-xs sm:text-sm text-cream font-medium truncate max-w-[80px] sm:max-w-[100px]">
                  {player.nickname}
                </span>
                {!isTeamMode && (
                  <span className="text-gold text-xs sm:text-sm font-display">
                    {player.round_score} pkt
                  </span>
                )}
                <span
                  className={cn(
                    'text-[10px] sm:text-xs px-2 py-0.5 rounded-full',
                    player.is_ready
                      ? 'bg-status-active/20 text-status-active'
                      : 'bg-status-waiting/20 text-status-waiting'
                  )}
                >
                  {player.is_ready ? 'Gotowy' : 'Oczekuje'}
                </span>
              </div>
            ))}
            
            {Array.from({ length: maxPlayers - room.room_players.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-lg bg-secondary/30 border border-dashed border-muted min-w-[90px] sm:min-w-[120px]"
              >
                <div className="w-12 h-12 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
                  <span className="text-muted-foreground text-xl sm:text-3xl">?</span>
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground">Wolne miejsce</span>
              </div>
            ))}
          </div>
        </section>

        {/* Team Selection (only for team mode) */}
        {isTeamMode && (
          <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg sm:text-xl font-display text-cream mb-3 sm:mb-4">Wybór Drużyn</h2>
            
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
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
        )}

        {/* Start Game (Host Only) */}
        {isHost && (
          <section className="animate-fade-in text-center" style={{ animationDelay: '0.2s' }}>
            <Button
              variant="gold"
              size="lg"
              disabled={!canStartGame}
              onClick={handleStartGame}
              className="min-w-48 sm:min-w-64 touch-target"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6" />
              Rozpocznij Grę
            </Button>
            
            {!canStartGame && (
              <p className="text-muted-foreground text-xs sm:text-sm mt-2 sm:mt-3">
                {isTeamMode 
                  ? 'Wymagane 4 osoby w drużynach 2 vs 2'
                  : `Wymagane co najmniej 2 graczy (maks. ${maxPlayers})`
                }
              </p>
            )}
          </section>
        )}

        {/* Room Link */}
        <section className="animate-fade-in text-center" style={{ animationDelay: '0.3s' }}>
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg bg-secondary/50 border border-border">
            <span className="text-muted-foreground text-xs sm:text-sm">Kod:</span>
            <code className="text-gold font-mono text-base sm:text-lg font-bold">
              {room.code}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="touch-target"
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
