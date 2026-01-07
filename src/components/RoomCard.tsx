import { Users, Play, Clock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'finished';
  hostId?: string;
  currentPlayerId?: string;
  onJoin: (roomId: string) => void;
  onDelete?: (roomId: string) => void;
}

export const RoomCard = ({
  id,
  name,
  playerCount,
  maxPlayers,
  status,
  hostId,
  currentPlayerId,
  onJoin,
  onDelete,
}: RoomCardProps) => {
  const isFull = playerCount >= maxPlayers;
  const canJoin = status === 'waiting' && !isFull;
  const isHost = hostId === currentPlayerId;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('Czy na pewno chcesz usunąć ten pokój?')) {
      onDelete(id);
    }
  };

  return (
    <div
      className={cn(
        'rounded-xl bg-gradient-to-br from-card to-card/80 border p-4',
        'transition-all duration-300 hover:scale-[1.02]',
        status === 'waiting' ? 'border-gold/30 hover:border-gold/50' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg text-cream truncate flex-1">{name}</h3>
        <div className="flex items-center gap-2">
          {isHost && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 h-7 w-7 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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
