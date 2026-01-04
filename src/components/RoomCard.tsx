import { Users, Play, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  onJoin: (roomId: string) => void;
}

export const RoomCard = ({
  id,
  name,
  playerCount,
  maxPlayers,
  status,
  onJoin,
}: RoomCardProps) => {
  const isFull = playerCount >= maxPlayers;
  const canJoin = status === 'waiting' && !isFull;

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-card to-card/80 border p-4',
        'transition-all duration-300 hover:scale-[1.02]',
        status === 'waiting' ? 'border-gold/30 hover:border-gold/50' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg text-cream truncate">{name}</h3>
        <div
          className={cn(
            'flex items-center gap-1 text-xs px-2 py-1 rounded-full',
            status === 'waiting'
              ? 'bg-status-waiting/20 text-status-waiting'
              : 'bg-status-active/20 text-status-active'
          )}
        >
          {status === 'waiting' ? (
            <>
              <Clock className="w-3 h-3" />
              Oczekiwanie
            </>
          ) : (
            <>
              <Play className="w-3 h-3" />
              W trakcie
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>
            {playerCount}/{maxPlayers} graczy
          </span>
        </div>

        <Button
          variant={canJoin ? 'gold' : 'secondary'}
          size="sm"
          disabled={!canJoin}
          onClick={() => onJoin(id)}
        >
          {isFull ? 'Pełny' : status === 'playing' ? 'Trwa' : 'Dołącz'}
        </Button>
      </div>
    </div>
  );
};
