import { Users, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface TeamPlayer {
  id: string;
  nickname: string;
  team: 'A' | 'B' | null;
  isReady: boolean;
  isHost: boolean;
}

interface TeamSelectorProps {
  teamId: 'A' | 'B';
  teamName: string;
  players: TeamPlayer[];
  currentPlayerId: string;
  isEditable: boolean;
  onJoinTeam: (teamId: 'A' | 'B') => void;
  onUpdateName: (name: string) => void;
}

const hatTypes = ['cowboy', 'bowler', 'sombrero', 'tophat'] as const;

export const TeamSelector = ({
  teamId,
  teamName,
  players,
  currentPlayerId,
  isEditable,
  onJoinTeam,
  onUpdateName,
}: TeamSelectorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(teamName);
  const isInTeam = players.some((p) => p.id === currentPlayerId);
  const isFull = players.length >= 2;

  const handleSaveName = () => {
    onUpdateName(editName);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-all duration-300',
        'bg-gradient-to-br from-card to-card/80',
        teamId === 'A'
          ? 'border-team-a/50 hover:border-team-a'
          : 'border-team-b/50 hover:border-team-b',
        isInTeam && (teamId === 'A' ? 'border-team-a glow-gold' : 'border-team-b glow-gold')
      )}
    >
      {/* Team Header */}
      <div className="flex items-center justify-between mb-4">
        {isEditing && isEditable ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="bg-secondary border-border text-cream h-8"
              autoFocus
            />
            <Button size="sm" variant="ghost" onClick={handleSaveName}>
              <Check className="w-4 h-4 text-status-active" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                teamId === 'A' ? 'bg-team-a' : 'bg-team-b'
              )}
            />
            <h3 className="font-display text-lg text-cream">{teamName}</h3>
            {isEditable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditing(true)}
                className="p-1 h-auto"
              >
                <Edit2 className="w-3 h-3 text-muted-foreground" />
              </Button>
            )}
          </div>
        )}
        <span className="text-sm text-muted-foreground">
          {players.length}/2
        </span>
      </div>

      {/* Players */}
      <div className="flex gap-4 justify-center mb-4 min-h-24">
        {players.map((player, index) => (
          <PlayerAvatar
            key={player.id}
            nickname={player.nickname}
            hatType={hatTypes[index % hatTypes.length]}
            team={teamId}
            size="md"
          />
        ))}
        {players.length === 0 && (
          <div className="flex items-center justify-center text-muted-foreground text-sm">
            <Users className="w-5 h-5 mr-2 opacity-50" />
            Brak graczy
          </div>
        )}
        {players.length === 1 && (
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted flex items-center justify-center">
            <span className="text-muted-foreground text-2xl">?</span>
          </div>
        )}
      </div>

      {/* Join Button */}
      {!isInTeam && (
        <Button
          variant={teamId === 'A' ? 'team_a' : 'team_b'}
          className="w-full"
          disabled={isFull}
          onClick={() => onJoinTeam(teamId)}
        >
          {isFull ? 'Drużyna pełna' : 'Dołącz do drużyny'}
        </Button>
      )}
    </div>
  );
};
