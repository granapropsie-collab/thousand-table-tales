import { Trophy } from 'lucide-react';

interface LastWinnerProps {
  teamName: string;
  score: string;
  date: string;
  rounds?: number;
}

export const LastWinner = ({ teamName, score, date, rounds }: LastWinnerProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-wood-dark via-wood-medium to-wood-dark border border-gold/30 p-6">
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 animate-shimmer" />
      
      <div className="relative flex items-center gap-6">
        {/* Trophy */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-dark via-gold to-gold-light flex items-center justify-center shadow-lg glow-gold">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <p className="text-muted-foreground text-sm uppercase tracking-wider mb-1">
            Ostatni Zwycięzca
          </p>
          <h3 className="text-2xl font-display gold-text font-bold mb-2">
            {teamName}
          </h3>
          <div className="flex items-center gap-4 text-sm text-cream/80">
            <span className="flex items-center gap-1">
              <span className="text-gold">Wynik:</span> {score}
            </span>
            {rounds && (
              <span className="flex items-center gap-1">
                <span className="text-gold">Rundy:</span> {rounds}
              </span>
            )}
            <span className="text-muted-foreground">{date}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
