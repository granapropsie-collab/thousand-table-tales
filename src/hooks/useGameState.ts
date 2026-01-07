import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Card {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '10' | 'K' | 'Q' | 'J' | '9';
  id: string;
  hidden?: boolean;
}

export interface RoomPlayer {
  id: string;
  room_id: string;
  player_id: string;
  nickname: string;
  team: 'A' | 'B' | null;
  is_ready: boolean;
  is_host: boolean;
  position: number;
  cards: Card[];
  tricks_won: any[];
  melds: { suit: string; points: number }[];
  round_score: number;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  host_id: string;
  with_musik: boolean;
  max_players: 2 | 3 | 4;
  game_mode: 'ffa' | 'teams';
  status: 'waiting' | 'playing' | 'finished';
  team_a_name: string;
  team_b_name: string;
  team_a_score: number;
  team_b_score: number;
  current_trump: 'hearts' | 'diamonds' | 'clubs' | 'spades' | null;
  current_bid: number;
  bid_winner_id: string | null;
  current_player_id: string | null;
  phase: 'lobby' | 'dealing' | 'bidding' | 'playing' | 'scoring' | 'finished';
  round_number: number;
  room_players: RoomPlayer[];
}

export interface TrickCard {
  id: string;
  room_id: string;
  player_id: string;
  card: Card;
  position: number;
}

// Generate a unique player ID (stored in localStorage)
const getPlayerId = (): string => {
  let id = localStorage.getItem('tysiac_player_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('tysiac_player_id', id);
  }
  return id;
};

export const useGameState = (roomId?: string) => {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentTrick, setCurrentTrick] = useState<TrickCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPlayingCard, setIsPlayingCard] = useState(false);
  const [playerId] = useState(getPlayerId);

  // Call edge function
  const callGameServer = useCallback(async (action: string, data: any) => {
    try {
      const response = await supabase.functions.invoke('game-server', {
        body: { action, data: { ...data, playerId } },
      });

      if (response.error) throw response.error;
      if (!response.data.success) throw new Error(response.data.error);

      return response.data;
    } catch (error: any) {
      console.error(`[useGameState] ${action} error:`, error);
      toast.error(error.message || 'Wystąpił błąd');
      throw error;
    }
  }, [playerId]);

  // Fetch room state
  const fetchRoom = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const result = await callGameServer('get_room', { roomId });
      setRoom(result.room);
      setCurrentTrick(result.trick || []);
    } catch (error) {
      console.error('[useGameState] fetchRoom error:', error);
    }
  }, [roomId, callGameServer]);

  // Create room
  const createRoom = useCallback(async (
    name: string, 
    nickname: string, 
    withMusik: boolean,
    maxPlayers: 2 | 3 | 4 = 4,
    gameMode: 'ffa' | 'teams' = 'ffa'
  ) => {
    setLoading(true);
    try {
      const result = await callGameServer('create_room', { name, nickname, withMusik, maxPlayers, gameMode });
      toast.success('Pokój utworzony!');
      return result.room;
    } finally {
      setLoading(false);
    }
  }, [callGameServer]);

  // Join room
  const joinRoom = useCallback(async (roomId: string, nickname: string) => {
    setLoading(true);
    try {
      await callGameServer('join_room', { roomId, nickname });
      toast.success('Dołączono do pokoju!');
    } finally {
      setLoading(false);
    }
  }, [callGameServer]);

  // Select team
  const selectTeam = useCallback(async (team: 'A' | 'B') => {
    if (!roomId) return;
    await callGameServer('select_team', { roomId, team });
  }, [roomId, callGameServer]);

  // Update team name
  const updateTeamName = useCallback(async (team: 'A' | 'B', name: string) => {
    if (!roomId) return;
    await callGameServer('update_team_name', { roomId, team, name });
  }, [roomId, callGameServer]);

  // Set ready
  const setReady = useCallback(async (isReady: boolean) => {
    if (!roomId) return;
    await callGameServer('set_ready', { roomId, isReady });
  }, [roomId, callGameServer]);

  // Start game
  const startGame = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      await callGameServer('start_game', { roomId });
      toast.success('Gra rozpoczęta!');
    } finally {
      setLoading(false);
    }
  }, [roomId, callGameServer]);

  // Bid
  const bid = useCallback(async (amount: number) => {
    if (!roomId) return;
    await callGameServer('bid', { roomId, amount });
  }, [roomId, callGameServer]);

  // Pass
  const pass = useCallback(async () => {
    if (!roomId) return;
    await callGameServer('pass', { roomId });
  }, [roomId, callGameServer]);

  // Declare meld (K+Q of a suit) - sets trump automatically
  const declareMeld = useCallback(async (suit: string) => {
    if (!roomId) return;
    await callGameServer('declare_meld', { roomId, suit });
  }, [roomId, callGameServer]);

  // Play card with debounce to prevent double-clicks
  const playCard = useCallback(async (cardId: string) => {
    if (!roomId || isPlayingCard) return;
    setIsPlayingCard(true);
    try {
      await callGameServer('play_card', { roomId, cardId });
    } finally {
      // Reset after a short delay to allow UI to update
      setTimeout(() => setIsPlayingCard(false), 500);
    }
  }, [roomId, callGameServer, isPlayingCard]);

  // Leave room
  const leaveRoom = useCallback(async () => {
    if (!roomId) return;
    await callGameServer('leave_room', { roomId });
  }, [roomId, callGameServer]);

  // Delete room (host only)
  const deleteRoom = useCallback(async (targetRoomId: string) => {
    await callGameServer('delete_room', { roomId: targetRoomId });
    toast.success('Pokój usunięty!');
  }, [callGameServer]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!roomId) return;

    fetchRoom();

    const roomChannel = supabase
      .channel(`room-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` },
        () => fetchRoom()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` },
        () => fetchRoom()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'current_trick', filter: `room_id=eq.${roomId}` },
        () => fetchRoom()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roomChannel);
    };
  }, [roomId, fetchRoom]);

  // Get current player info
  const currentPlayer = room?.room_players.find((p) => p.player_id === playerId);
  const isHost = currentPlayer?.is_host || false;
  const isMyTurn = room?.current_player_id === playerId;

  return {
    room,
    currentTrick,
    loading,
    playerId,
    currentPlayer,
    isHost,
    isMyTurn,
    isPlayingCard,
    createRoom,
    joinRoom,
    selectTeam,
    updateTeamName,
    setReady,
    startGame,
    bid,
    pass,
    declareMeld,
    playCard,
    leaveRoom,
    deleteRoom,
    fetchRoom,
  };
};

// Hook for fetching rooms list
export const useRoomsList = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lastWinner, setLastWinner] = useState<{ team_name: string; score: string; rounds: number; won_at: string } | null>(null);

  useEffect(() => {
    const fetchRooms = async () => {
      const { data } = await supabase
        .from('rooms')
        .select('*, room_players(*)')
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false });

      setRooms((data as unknown as Room[]) || []);
    };

    const fetchLastWinner = async () => {
      const { data } = await supabase
        .from('last_winners')
        .select()
        .order('won_at', { ascending: false })
        .limit(1)
        .single();

      if (data) setLastWinner(data);
    };

    fetchRooms();
    fetchLastWinner();

    const channel = supabase
      .channel('rooms-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, fetchRooms)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players' }, fetchRooms)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { rooms, lastWinner };
};
