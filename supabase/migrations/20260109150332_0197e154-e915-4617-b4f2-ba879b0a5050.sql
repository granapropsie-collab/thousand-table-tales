-- Add total_score column to room_players for tracking cumulative game score
ALTER TABLE public.room_players 
ADD COLUMN IF NOT EXISTS total_score integer NOT NULL DEFAULT 0;