import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spade, Users, Plus } from 'lucide-react';
import { LastWinner } from '@/components/LastWinner';
import { RoomCard } from '@/components/RoomCard';
import { CreateRoomForm } from '@/components/CreateRoomForm';
import { useRoomsList, useGameState } from '@/hooks/useGameState';

const Index = () => {
  const navigate = useNavigate();
  const { rooms, lastWinner } = useRoomsList();
  const { createRoom, joinRoom, playerId } = useGameState();
  const [nickname, setNickname] = useState(() => 
    localStorage.getItem('tysiac_nickname') || ''
  );

  const handleJoinRoom = async (roomId: string) => {
    const name = nickname || prompt('Podaj swój nick:');
    if (!name) return;
    
    localStorage.setItem('tysiac_nickname', name);
    await joinRoom(roomId, name);
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = async (data: { 
    roomName: string; 
    nickname: string; 
    withMusik: boolean;
    maxPlayers: 2 | 3 | 4;
    gameMode: 'ffa' | 'teams';
  }) => {
    localStorage.setItem('tysiac_nickname', data.nickname);
    const room = await createRoom(data.roomName, data.nickname, data.withMusik, data.maxPlayers, data.gameMode);
    if (room) {
      navigate(`/room/${room.id}`);
    }
  };

  const waitingRooms = rooms.filter(r => r.status === 'waiting');

  return (
    <div className="min-h-screen wood-texture">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4">
            <Spade className="w-10 h-10 text-gold" />
            <h1 className="text-4xl md:text-5xl font-display gold-text text-shadow">
              Tysiąc
            </h1>
            <Spade className="w-10 h-10 text-gold rotate-180" />
          </div>
          <p className="text-center text-muted-foreground mt-2">
            Klasyczna polska gra karciana • Multiplayer online
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Last Winner Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {lastWinner ? (
            <LastWinner 
              teamName={lastWinner.team_name}
              score={lastWinner.score}
              date={new Date(lastWinner.won_at).toLocaleDateString('pl-PL')}
              rounds={lastWinner.rounds}
            />
          ) : (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <p className="text-muted-foreground">
                🏆 Brak zwycięzców - bądź pierwszy!
              </p>
            </div>
          )}
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Rooms */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-display text-cream">Aktywne Pokoje</h2>
              <span className="text-muted-foreground text-sm">({waitingRooms.length})</span>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {waitingRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  id={room.id}
                  name={room.name}
                  playerCount={room.room_players?.length || 0}
                  maxPlayers={4}
                  status={room.status}
                  onJoin={handleJoinRoom}
                />
              ))}
              
              {waitingRooms.length === 0 && (
                <div className="rounded-xl bg-card/50 border border-border p-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">
                    Brak aktywnych pokoi. Utwórz nowy!
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Create Room */}
          <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Plus className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-display text-cream">Utwórz Pokój</h2>
            </div>
            
            <div className="rounded-xl bg-card border border-border p-6">
              <CreateRoomForm onCreateRoom={handleCreateRoom} />
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="text-center text-muted-foreground text-sm pt-8 border-t border-border/30">
          <p>
            Gra dla 2-4 graczy • Tryb drużynowy 2v2 • 
            <span className="text-gold ml-1">Tylko prywatne pokoje</span>
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
