-- Add max_players and game_mode columns to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS max_players integer NOT NULL DEFAULT 4 CHECK (max_players >= 2 AND max_players <= 4);

ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS game_mode text NOT NULL DEFAULT 'ffa' CHECK (game_mode IN ('ffa', 'teams'));