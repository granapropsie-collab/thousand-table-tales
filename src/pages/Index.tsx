import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spade, Users, Plus } from 'lucide-react';
import { LastWinner } from '@/components/LastWinner';
import { RoomCard } from '@/components/RoomCard';
import { CreateRoomForm } from '@/components/CreateRoomForm';
import { toast } from 'sonner';

// Mock data for demonstration
const mockLastWinner = {
  teamName: 'Asy Kier',
  score: '1000 : 820',
  date: '3 stycznia 2026',
  rounds: 12,
};

const mockRooms = [
  { id: '1', name: 'Saloon Kowbojów', playerCount: 2, maxPlayers: 4, status: 'waiting' as const },
  { id: '2', name: 'Poker Night', playerCount: 4, maxPlayers: 4, status: 'playing' as const },
  { id: '3', name: 'Partyjka u Staszka', playerCount: 1, maxPlayers: 4, status: 'waiting' as const },
];

const Index = () => {
  const navigate = useNavigate();
  const [rooms] = useState(mockRooms);

  const handleJoinRoom = (roomId: string) => {
    toast.success('Dołączanie do pokoju...');
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = (data: { roomName: string; nickname: string; withMusik: boolean }) => {
    toast.success(`Pokój "${data.roomName}" został utworzony!`);
    // In real app, this would create a room via WebSocket and get roomId
    navigate('/room/new');
  };

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
            Klasyczna polska gra karciana
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-10">
        {/* Last Winner Section */}
        <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <LastWinner {...mockLastWinner} />
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Active Rooms */}
          <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-gold" />
              <h2 className="text-2xl font-display text-cream">Aktywne Pokoje</h2>
            </div>
            
            <div className="space-y-3">
              {rooms.filter(r => r.status === 'waiting' || r.playerCount > 0).map((room) => (
                <RoomCard
                  key={room.id}
                  {...room}
                  onJoin={handleJoinRoom}
                />
              ))}
              
              {rooms.length === 0 && (
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
