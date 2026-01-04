import { cn } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface ScoreboardProps {
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  winner?: 'A' | 'B';
  onNewGame?: () => void;
}

export const Scoreboard = ({
  teamAName,
  teamBName,
  teamAScore,
  teamBScore,
  winner,
  onNewGame,
}: ScoreboardProps) => {
  const navigate = useNavigate();

  if (winner) {
    const winnerName = winner === 'A' ? teamAName : teamBName;
    const winnerScore = winner === 'A' ? teamAScore : teamBScore;
    const loserScore = winner === 'A' ? teamBScore : teamAScore;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md">
        <div className="bg-card border border-gold/50 rounded-2xl p-8 max-w-lg w-full mx-4 text-center animate-scale-in shadow-2xl">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold-dark via-gold to-gold-light flex items-center justify-center glow-gold animate-pulse-glow">
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl font-display gold-text mb-2">Zwycięstwo!</h2>
          <p className="text-xl text-cream mb-6">{winnerName}</p>
          
          <div className="flex justify-center gap-8 mb-8">
            <div className={cn('text-center', winner === 'A' && 'scale-110')}>
              <span className="block text-muted-foreground text-sm">{teamAName}</span>
              <span className={cn('text-3xl font-display', winner === 'A' ? 'text-gold' : 'text-muted-foreground')}>
                {teamAScore}
              </span>
            </div>
            <div className="text-2xl text-muted-foreground">:</div>
            <div className={cn('text-center', winner === 'B' && 'scale-110')}>
              <span className="block text-muted-foreground text-sm">{teamBName}</span>
              <span className={cn('text-3xl font-display', winner === 'B' ? 'text-gold' : 'text-muted-foreground')}>
                {teamBScore}
              </span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => navigate('/')}>
              Wróć do lobby
            </Button>
            {onNewGame && (
              <Button variant="gold" className="flex-1" onClick={onNewGame}>
                Nowa gra
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/90 backdrop-blur px-4 py-3 rounded-lg border border-border space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-team-a" />
        <span className="text-cream text-sm font-medium flex-1 truncate">{teamAName}</span>
        <span className={cn(
          'font-display text-lg',
          teamAScore >= 1000 ? 'text-gold animate-pulse' : 'text-cream'
        )}>
          {teamAScore}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-team-b" />
        <span className="text-cream text-sm font-medium flex-1 truncate">{teamBName}</span>
        <span className={cn(
          'font-display text-lg',
          teamBScore >= 1000 ? 'text-gold animate-pulse' : 'text-cream'
        )}>
          {teamBScore}
        </span>
      </div>
    </div>
  );
};
