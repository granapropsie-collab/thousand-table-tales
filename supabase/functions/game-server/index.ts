import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Game constants
const SUITS = ["hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["A", "10", "K", "Q", "J", "9"] as const;
const CARD_POINTS: Record<string, number> = { A: 11, "10": 10, K: 4, Q: 3, J: 2, "9": 0 };
const MELD_POINTS: Record<string, number> = { spades: 40, clubs: 60, diamonds: 80, hearts: 100 };

interface Card {
  suit: typeof SUITS[number];
  rank: typeof RANKS[number];
  id: string;
}

// Create full deck
function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, id: `${rank}_${suit}` });
    }
  }
  return deck;
}

// Shuffle deck (Fisher-Yates)
function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Deal cards
function dealCards(withMusik: boolean): { hands: Card[][]; musik: Card[] } {
  const deck = shuffleDeck(createDeck());
  const hands: Card[][] = [[], [], [], []];
  let musik: Card[] = [];

  if (withMusik) {
    // 5 cards each + 4 musik
    for (let i = 0; i < 5; i++) {
      for (let p = 0; p < 4; p++) {
        hands[p].push(deck[i * 4 + p]);
      }
    }
    musik = deck.slice(20, 24);
  } else {
    // 6 cards each, no musik
    for (let i = 0; i < 6; i++) {
      for (let p = 0; p < 4; p++) {
        hands[p].push(deck[i * 4 + p]);
      }
    }
  }

  return { hands, musik };
}

// Check if player can meld (has K+Q of same suit)
function findMelds(cards: Card[]): { suit: string; points: number }[] {
  const melds: { suit: string; points: number }[] = [];
  for (const suit of SUITS) {
    const hasKing = cards.some((c) => c.suit === suit && c.rank === "K");
    const hasQueen = cards.some((c) => c.suit === suit && c.rank === "Q");
    if (hasKing && hasQueen) {
      melds.push({ suit, points: MELD_POINTS[suit] });
    }
  }
  return melds;
}

// Calculate points in cards
function calculatePoints(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + CARD_POINTS[card.rank], 0);
}

// Determine trick winner
function determineTrickWinner(
  trick: { playerId: string; card: Card; position: number }[],
  trump: string | null,
  leadSuit: string
): string {
  let winner = trick[0];
  
  for (let i = 1; i < trick.length; i++) {
    const current = trick[i];
    const currentCard = current.card;
    const winnerCard = winner.card;
    
    // Trump beats non-trump
    if (trump) {
      if (currentCard.suit === trump && winnerCard.suit !== trump) {
        winner = current;
        continue;
      }
      if (winnerCard.suit === trump && currentCard.suit !== trump) {
        continue;
      }
    }
    
    // Same suit - higher rank wins
    if (currentCard.suit === winnerCard.suit) {
      const currentRankIndex = RANKS.indexOf(currentCard.rank);
      const winnerRankIndex = RANKS.indexOf(winnerCard.rank);
      if (currentRankIndex < winnerRankIndex) {
        winner = current;
      }
    }
    
    // Following lead suit beats other suits (when no trump)
    if (currentCard.suit === leadSuit && winnerCard.suit !== leadSuit && winnerCard.suit !== trump) {
      winner = current;
    }
  }
  
  return winner.playerId;
}

// Check if card can be played
function canPlayCard(
  card: Card,
  playerHand: Card[],
  leadSuit: string | null,
  trump: string | null
): boolean {
  // First card in trick - can play anything
  if (!leadSuit) return true;
  
  // Must follow suit if possible
  const hasSuit = playerHand.some((c) => c.suit === leadSuit);
  if (hasSuit) {
    return card.suit === leadSuit;
  }
  
  // No lead suit - can play anything
  return true;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, data } = await req.json();
    console.log(`[GameServer] Action: ${action}`, data);

    switch (action) {
      // CREATE ROOM
      case "create_room": {
        const { name, nickname, withMusik, playerId } = data;
        
        // Create room
        const { data: room, error: roomError } = await supabase
          .from("rooms")
          .insert({
            name,
            host_id: playerId,
            with_musik: withMusik,
          })
          .select()
          .single();

        if (roomError) throw roomError;

        // Add host as player
        const { error: playerError } = await supabase
          .from("room_players")
          .insert({
            room_id: room.id,
            player_id: playerId,
            nickname,
            is_host: true,
            position: 0,
          });

        if (playerError) throw playerError;

        console.log(`[GameServer] Room created: ${room.id}`);
        return new Response(JSON.stringify({ success: true, room }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // JOIN ROOM
      case "join_room": {
        const { roomId, nickname, playerId } = data;

        // Get current players
        const { data: players } = await supabase
          .from("room_players")
          .select("position")
          .eq("room_id", roomId);

        const usedPositions = players?.map((p) => p.position) || [];
        const nextPosition = [0, 1, 2, 3].find((p) => !usedPositions.includes(p));

        if (nextPosition === undefined) {
          throw new Error("Room is full");
        }

        const { error } = await supabase.from("room_players").insert({
          room_id: roomId,
          player_id: playerId,
          nickname,
          position: nextPosition,
        });

        if (error) throw error;

        console.log(`[GameServer] Player ${playerId} joined room ${roomId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SELECT TEAM
      case "select_team": {
        const { roomId, playerId, team } = data;

        const { error } = await supabase
          .from("room_players")
          .update({ team })
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        if (error) throw error;

        console.log(`[GameServer] Player ${playerId} joined team ${team}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // UPDATE TEAM NAME
      case "update_team_name": {
        const { roomId, team, name } = data;

        const column = team === "A" ? "team_a_name" : "team_b_name";
        const { error } = await supabase
          .from("rooms")
          .update({ [column]: name })
          .eq("id", roomId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SET READY
      case "set_ready": {
        const { roomId, playerId, isReady } = data;

        const { error } = await supabase
          .from("room_players")
          .update({ is_ready: isReady })
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // START GAME
      case "start_game": {
        const { roomId } = data;

        // Get room and players
        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.room_players.length !== 4) throw new Error("Need 4 players");

        // Deal cards
        const { hands, musik } = dealCards(room.with_musik);

        // Update players with cards
        for (let i = 0; i < 4; i++) {
          const player = room.room_players.find((p: any) => p.position === i);
          if (player) {
            await supabase
              .from("room_players")
              .update({ cards: hands[i], round_score: 0, tricks_won: [], melds: [] })
              .eq("id", player.id);
          }
        }

        // Store musik if using it
        if (room.with_musik) {
          await supabase.from("musik").insert({
            room_id: roomId,
            cards: musik,
          });
        }

        // Update room state
        const firstPlayerId = room.room_players.find((p: any) => p.position === 0)?.player_id;
        await supabase
          .from("rooms")
          .update({
            status: "playing",
            phase: "bidding",
            round_number: 1,
            current_player_id: firstPlayerId,
            current_bid: 100,
          })
          .eq("id", roomId);

        console.log(`[GameServer] Game started in room ${roomId}`);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // BID
      case "bid": {
        const { roomId, playerId, amount } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.current_player_id !== playerId) throw new Error("Not your turn");

        // Update bid
        await supabase
          .from("rooms")
          .update({
            current_bid: amount,
            bid_winner_id: playerId,
          })
          .eq("id", roomId);

        // Move to next player
        const currentPlayer = room.room_players.find((p: any) => p.player_id === playerId);
        const nextPosition = (currentPlayer.position + 1) % 4;
        const nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);

        await supabase
          .from("rooms")
          .update({ current_player_id: nextPlayer.player_id })
          .eq("id", roomId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PASS (bidding)
      case "pass": {
        const { roomId, playerId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");

        // Mark player as passed
        await supabase
          .from("room_players")
          .update({ is_ready: false }) // Reusing is_ready as "still in bidding"
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        // Check if bidding is over (only one player left or all passed)
        const activeBidders = room.room_players.filter((p: any) => p.is_ready !== false);
        
        if (activeBidders.length <= 1 || room.bid_winner_id) {
          // Bidding complete - move to playing phase
          await supabase
            .from("rooms")
            .update({ phase: "playing" })
            .eq("id", roomId);

          // If musik, reveal it to bid winner
          if (room.with_musik) {
            await supabase
              .from("musik")
              .update({ revealed: true })
              .eq("room_id", roomId);
          }
        } else {
          // Move to next player
          const currentPlayer = room.room_players.find((p: any) => p.player_id === playerId);
          const nextPosition = (currentPlayer.position + 1) % 4;
          const nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);

          await supabase
            .from("rooms")
            .update({ current_player_id: nextPlayer.player_id })
            .eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // SELECT TRUMP
      case "select_trump": {
        const { roomId, playerId, trump } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select()
          .eq("id", roomId)
          .single();

        if (room?.bid_winner_id !== playerId) {
          throw new Error("Only bid winner can select trump");
        }

        await supabase
          .from("rooms")
          .update({ current_trump: trump, phase: "playing" })
          .eq("id", roomId);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // PLAY CARD
      case "play_card": {
        const { roomId, playerId, cardId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        if (!room) throw new Error("Room not found");
        if (room.current_player_id !== playerId) throw new Error("Not your turn");

        const player = room.room_players.find((p: any) => p.player_id === playerId);
        const card = player.cards.find((c: any) => c.id === cardId);

        if (!card) throw new Error("Card not in hand");

        // Get current trick
        const { data: trick } = await supabase
          .from("current_trick")
          .select()
          .eq("room_id", roomId)
          .order("position", { ascending: true });

        const leadSuit = trick?.[0]?.card?.suit || null;

        // Validate play
        if (!canPlayCard(card, player.cards, leadSuit, room.current_trump)) {
          throw new Error("Invalid play - must follow suit");
        }

        // Remove card from hand
        const newHand = player.cards.filter((c: any) => c.id !== cardId);
        await supabase
          .from("room_players")
          .update({ cards: newHand })
          .eq("id", player.id);

        // Add to trick
        await supabase.from("current_trick").insert({
          room_id: roomId,
          player_id: playerId,
          card,
          position: trick?.length || 0,
        });

        // Check for meld (if starting a trick with K or Q)
        if (!trick?.length) {
          const melds = findMelds(player.cards);
          const playedMeld = melds.find(
            (m) => m.suit === card.suit && (card.rank === "K" || card.rank === "Q")
          );
          if (playedMeld) {
            const existingMelds = player.melds || [];
            await supabase
              .from("room_players")
              .update({ melds: [...existingMelds, playedMeld] })
              .eq("id", player.id);
          }
        }

        // Check if trick is complete
        if ((trick?.length || 0) + 1 === 4) {
          // Determine winner
          const fullTrick = [
            ...trick!.map((t: any) => ({ playerId: t.player_id, card: t.card, position: t.position })),
            { playerId, card, position: trick?.length || 0 },
          ];
          
          const winnerId = determineTrickWinner(fullTrick, room.current_trump, leadSuit!);
          const winnerPlayer = room.room_players.find((p: any) => p.player_id === winnerId);

          // Calculate points
          const trickPoints = calculatePoints(fullTrick.map((t) => t.card));
          const existingTricks = winnerPlayer.tricks_won || [];
          
          await supabase
            .from("room_players")
            .update({
              tricks_won: [...existingTricks, fullTrick],
              round_score: (winnerPlayer.round_score || 0) + trickPoints,
            })
            .eq("id", winnerPlayer.id);

          // Clear trick
          await supabase.from("current_trick").delete().eq("room_id", roomId);

          // Check if round is over
          if (newHand.length === 0) {
            // Round complete - calculate scores
            await supabase
              .from("rooms")
              .update({ phase: "scoring" })
              .eq("id", roomId);
          } else {
            // Winner starts next trick
            await supabase
              .from("rooms")
              .update({ current_player_id: winnerId })
              .eq("id", roomId);
          }
        } else {
          // Move to next player
          const nextPosition = (player.position + 1) % 4;
          const nextPlayer = room.room_players.find((p: any) => p.position === nextPosition);
          
          await supabase
            .from("rooms")
            .update({ current_player_id: nextPlayer.player_id })
            .eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // GET ROOM STATE
      case "get_room": {
        const { roomId, playerId } = data;

        const { data: room } = await supabase
          .from("rooms")
          .select("*, room_players(*)")
          .eq("id", roomId)
          .single();

        const { data: trick } = await supabase
          .from("current_trick")
          .select()
          .eq("room_id", roomId);

        const { data: musik } = await supabase
          .from("musik")
          .select()
          .eq("room_id", roomId)
          .single();

        // Get player's team to determine what cards to show
        const currentPlayer = room?.room_players.find((p: any) => p.player_id === playerId);
        const playerTeam = currentPlayer?.team;

        // Filter cards based on team visibility
        const playersWithVisibility = room?.room_players.map((p: any) => ({
          ...p,
          cards: p.team === playerTeam ? p.cards : p.cards.map(() => ({ hidden: true })),
        }));

        return new Response(
          JSON.stringify({
            success: true,
            room: { ...room, room_players: playersWithVisibility },
            trick,
            musik: musik?.revealed ? musik : null,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // LEAVE ROOM
      case "leave_room": {
        const { roomId, playerId } = data;

        await supabase
          .from("room_players")
          .delete()
          .eq("room_id", roomId)
          .eq("player_id", playerId);

        // Check if room is empty
        const { data: remainingPlayers } = await supabase
          .from("room_players")
          .select()
          .eq("room_id", roomId);

        if (!remainingPlayers?.length) {
          await supabase.from("rooms").delete().eq("id", roomId);
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("[GameServer] Error:", errorMessage);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
