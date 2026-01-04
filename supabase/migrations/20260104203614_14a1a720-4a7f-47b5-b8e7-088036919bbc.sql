-- Tabela pokoi gry
CREATE TABLE public.rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE DEFAULT substring(md5(random()::text), 1, 6),
  host_id UUID,
  with_musik BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  team_a_name TEXT NOT NULL DEFAULT 'Drużyna A',
  team_b_name TEXT NOT NULL DEFAULT 'Drużyna B',
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  current_trump TEXT CHECK (current_trump IN ('hearts', 'diamonds', 'clubs', 'spades')),
  current_bid INTEGER DEFAULT 100,
  bid_winner_id UUID,
  current_player_id UUID,
  phase TEXT NOT NULL DEFAULT 'lobby' CHECK (phase IN ('lobby', 'dealing', 'bidding', 'playing', 'scoring', 'finished')),
  round_number INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela graczy w pokoju
CREATE TABLE public.room_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  nickname TEXT NOT NULL,
  team TEXT CHECK (team IN ('A', 'B')),
  is_ready BOOLEAN NOT NULL DEFAULT false,
  is_host BOOLEAN NOT NULL DEFAULT false,
  position INTEGER CHECK (position >= 0 AND position <= 3),
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  tricks_won JSONB NOT NULL DEFAULT '[]'::jsonb,
  melds JSONB NOT NULL DEFAULT '[]'::jsonb,
  round_score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, player_id),
  UNIQUE(room_id, position)
);

-- Tabela aktualnej lewy
CREATE TABLE public.current_trick (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  card JSONB NOT NULL,
  position INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela musiku
CREATE TABLE public.musik (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  revealed BOOLEAN NOT NULL DEFAULT false
);

-- Tabela ostatnich zwycięzców
CREATE TABLE public.last_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  score TEXT NOT NULL,
  rounds INTEGER NOT NULL DEFAULT 0,
  won_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.current_trick ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.musik ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.last_winners ENABLE ROW LEVEL SECURITY;

-- Polityki RLS - publiczny dostęp do odczytu (gra publiczna dla znajomych)
CREATE POLICY "Rooms are publicly readable" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Room players are publicly readable" ON public.room_players FOR SELECT USING (true);
CREATE POLICY "Current trick is publicly readable" ON public.current_trick FOR SELECT USING (true);
CREATE POLICY "Last winners are publicly readable" ON public.last_winners FOR SELECT USING (true);

-- Musik widoczny tylko dla zwycięzcy licytacji lub po ujawnieniu
CREATE POLICY "Musik readable when revealed or by bid winner" ON public.musik 
  FOR SELECT USING (revealed = true OR EXISTS (
    SELECT 1 FROM rooms r WHERE r.id = room_id AND r.bid_winner_id = auth.uid()
  ));

-- Zapis tylko przez edge functions (service role)
CREATE POLICY "Rooms insert via service" ON public.rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Rooms update via service" ON public.rooms FOR UPDATE USING (true);
CREATE POLICY "Room players insert via service" ON public.room_players FOR INSERT WITH CHECK (true);
CREATE POLICY "Room players update via service" ON public.room_players FOR UPDATE USING (true);
CREATE POLICY "Room players delete via service" ON public.room_players FOR DELETE USING (true);
CREATE POLICY "Current trick insert via service" ON public.current_trick FOR INSERT WITH CHECK (true);
CREATE POLICY "Current trick delete via service" ON public.current_trick FOR DELETE USING (true);
CREATE POLICY "Musik insert via service" ON public.musik FOR INSERT WITH CHECK (true);
CREATE POLICY "Musik update via service" ON public.musik FOR UPDATE USING (true);
CREATE POLICY "Last winners insert via service" ON public.last_winners FOR INSERT WITH CHECK (true);

-- Funkcja do aktualizacji updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger dla updated_at
CREATE TRIGGER update_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Włącz realtime dla synchronizacji stanu gry
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.current_trick;