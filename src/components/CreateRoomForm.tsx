import { useState } from 'react';
import { Plus, User, Music, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface CreateRoomFormProps {
  onCreateRoom: (data: { 
    roomName: string; 
    nickname: string; 
    withMusik: boolean;
    maxPlayers: 2 | 3 | 4;
    gameMode: 'ffa' | 'teams';
  }) => void;
}

export const CreateRoomForm = ({ onCreateRoom }: CreateRoomFormProps) => {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const [withMusik, setWithMusik] = useState(true);
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [gameMode, setGameMode] = useState<'ffa' | 'teams'>('ffa');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && nickname.trim()) {
      onCreateRoom({ roomName, nickname, withMusik, maxPlayers, gameMode });
    }
  };

  // 4 players can be teams or FFA, 2-3 players are FFA only
  const canBeTeams = maxPlayers === 4;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="roomName" className="text-cream flex items-center gap-2">
          <Plus className="w-4 h-4 text-gold" />
          Nazwa pokoju
        </Label>
        <Input
          id="roomName"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          placeholder="np. Saloon Kowbojów"
          className="bg-secondary border-border text-cream placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-cream flex items-center gap-2">
          <User className="w-4 h-4 text-gold" />
          Twój nick
        </Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="np. Wyga Billy"
          className="bg-secondary border-border text-cream placeholder:text-muted-foreground"
        />
      </div>

      {/* Player count selection */}
      <div className="space-y-2">
        <Label className="text-cream flex items-center gap-2">
          <Users className="w-4 h-4 text-gold" />
          Liczba graczy
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setMaxPlayers(num);
                // Force FFA for 2-3 players
                if (num < 4) setGameMode('ffa');
              }}
              className={cn(
                'py-3 px-4 rounded-lg border-2 transition-all text-center touch-manipulation',
                'min-h-[52px] active:scale-95',
                maxPlayers === num
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-gold/50'
              )}
            >
              <span className="text-lg font-medium">{num}</span>
              <span className="text-xs block opacity-70">
                {num === 2 ? 'gracze' : num === 3 ? 'gracze' : 'gracze'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Game mode selection (only for 4 players) */}
      {canBeTeams && (
        <div className="space-y-2">
          <Label className="text-cream">Tryb gry</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setGameMode('ffa')}
              className={cn(
                'py-3 px-4 rounded-lg border-2 transition-all text-center touch-manipulation',
                'min-h-[52px] active:scale-95',
                gameMode === 'ffa'
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-gold/50'
              )}
            >
              <span className="text-sm font-medium">Każdy na siebie</span>
              <span className="text-xs block opacity-70">Free-for-all</span>
            </button>
            <button
              type="button"
              onClick={() => setGameMode('teams')}
              className={cn(
                'py-3 px-4 rounded-lg border-2 transition-all text-center touch-manipulation',
                'min-h-[52px] active:scale-95',
                gameMode === 'teams'
                  ? 'border-gold bg-gold/20 text-gold'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:border-gold/50'
              )}
            >
              <span className="text-sm font-medium">Drużynowo</span>
              <span className="text-xs block opacity-70">2 vs 2</span>
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-gold flex-shrink-0" />
          <div>
            <Label htmlFor="withMusik" className="text-cream cursor-pointer text-sm">
              Gra z musikiem
            </Label>
            <p className="text-xs text-muted-foreground">
              4 karty do przydzielenia
            </p>
          </div>
        </div>
        <Switch
          id="withMusik"
          checked={withMusik}
          onCheckedChange={setWithMusik}
          className="data-[state=checked]:bg-gold"
        />
      </div>

      <Button
        type="submit"
        variant="gold"
        size="lg"
        className="w-full min-h-[52px] touch-manipulation"
        disabled={!roomName.trim() || !nickname.trim()}
      >
        <Plus className="w-5 h-5" />
        Utwórz Pokój
      </Button>
    </form>
  );
};
