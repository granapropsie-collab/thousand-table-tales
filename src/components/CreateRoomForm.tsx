import { useState } from 'react';
import { Plus, User, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface CreateRoomFormProps {
  onCreateRoom: (data: { roomName: string; nickname: string; withMusik: boolean }) => void;
}

export const CreateRoomForm = ({ onCreateRoom }: CreateRoomFormProps) => {
  const [roomName, setRoomName] = useState('');
  const [nickname, setNickname] = useState('');
  const [withMusik, setWithMusik] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim() && nickname.trim()) {
      onCreateRoom({ roomName, nickname, withMusik });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
        <div className="flex items-center gap-3">
          <Music className="w-5 h-5 text-gold" />
          <div>
            <Label htmlFor="withMusik" className="text-cream cursor-pointer">
              Gra z musikiem
            </Label>
            <p className="text-xs text-muted-foreground">
              4 karty do przydzielenia przez zwycięzcę licytacji
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
        className="w-full"
        disabled={!roomName.trim() || !nickname.trim()}
      >
        <Plus className="w-5 h-5" />
        Utwórz Pokój
      </Button>
    </form>
  );
};
